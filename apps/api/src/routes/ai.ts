import { Response, NextFunction, Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";
import fs from "fs";
import path from "path";

const LOG_FILE = path.resolve(process.cwd(), "../../output/api/ai-prompts.log");

function logPrompt(label: string, system: string, user: string): void {
  const entry = [
    `${"─".repeat(72)}`,
    `[${new Date().toISOString()}] ${label}`,
    `── SYSTEM ──`,
    system,
    `── USER ──`,
    user,
    "",
  ].join("\n");
  fs.appendFileSync(LOG_FILE, entry, "utf8");
}

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

type CandidateAnalysis = { matchPercent: number; strengths: string[]; weaknesses: string[]; summary: string };
type BestAnalysis = { applicationId: number; reason: string };

const candidateCache = new Map<number, CandidateAnalysis>();
const bestCache = new Map<string, BestAnalysis>();

function bestCacheKey(ids: number[]): string {
  return [...ids].sort((a, b) => a - b).join(",");
}

// POST /api/ai/email-template
// Streams an email template body based on name + subject
router.post("/email-template", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user!.plan !== 'ultimate') {
      res.status(403).json({ success: false, error: 'This feature requires the Ultimate plan' });
      return;
    }

    const { name, subject } = req.body as { name?: string; subject?: string };
    if (!name?.trim()) {
      res.status(400).json({ success: false, error: "Template name is required" });
      return;
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering if present

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an HR professional writing reusable email templates for candidate communication.

Generate a professional email template body for the following:
Template name: ${name.trim()}${subject?.trim() ? `\nSubject: ${subject.trim()}` : ""}

Requirements:
- Warm, professional tone
- Use these placeholders where appropriate: {{candidateName}}, {{roleName}}, {{companyName}}
- Concise and focused — no filler
- Output only the email body text, no subject line or extra metadata
- No markdown formatting`,
        },
      ],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(event.delta.text);
      }
    }

    res.end();
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/compare
// Streams NDJSON — one candidate result per line, then a "best" line
router.post("/compare", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user!.plan !== 'ultimate') {
      res.status(403).json({ success: false, error: 'This feature requires the Ultimate plan' });
      return;
    }

    const { applicationIds, forceRefresh = false } = req.body as { applicationIds?: unknown; forceRefresh?: boolean };

    if (!Array.isArray(applicationIds) || applicationIds.length < 2 || applicationIds.length > 10 || !applicationIds.every((id) => typeof id === "number")) {
      res.status(400).json({ success: false, error: "applicationIds must be an array of 2–10 numbers" });
      return;
    }

    const companyId = req.user!.companyId;

    // Fetch all applications (with role)
    const applications = await Promise.all(
      (applicationIds as number[]).map((id) =>
        prisma.application.findFirst({
          where: { id, companyId },
          include: { role: true },
        }),
      ),
    );

    const missing = applications.findIndex((a) => a === null);
    if (missing !== -1) {
      res.status(400).json({ success: false, error: `Application ${applicationIds[missing]} not found` });
      return;
    }

    const apps = applications as NonNullable<(typeof applications)[number]>[];
    const firstRoleId = apps[0].roleId;
    if (apps.some((a) => a.roleId !== firstRoleId)) {
      res.status(400).json({ success: false, error: "All applications must belong to the same role" });
      return;
    }

    const role = apps[0].role;
    const customFields = (role.customFields as { name: string; label: string }[]) ?? [];

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");

    const summaries: { applicationId: number; matchPercent: number; summary: string }[] = [];

    for (const app of apps) {
      let analysis = forceRefresh ? undefined : candidateCache.get(app.id);

      if (!analysis) {
        const formData = (app.formData ?? {}) as Record<string, unknown>;
        const extractedTexts = (app.extractedTexts ?? {}) as Record<string, unknown>;

        const candidateLines: string[] = [];
        for (const [key, value] of Object.entries(formData)) {
          const field = customFields.find((f) => f.name === key);
          const label = field?.label ?? key;
          candidateLines.push(`${label}: ${value}`);
        }
        const allExtractedText = Object.values(extractedTexts).filter(Boolean).join("\n");
        if (allExtractedText) {
          candidateLines.push(`Resume text: ${allExtractedText}`);
        }

        const prompt = `Role: ${role.name}
Description: ${role.description ?? "N/A"}
Requirements: ${role.requirements.join(", ") || "N/A"}

Candidate data:
${candidateLines.join("\n")}`;

        const candidateSystem = 'You are an HR analyst. Evaluate how well this candidate matches the role requirements.\nRespond ONLY with valid JSON: {"matchPercent":<0-100>,"strengths":["..."],"weaknesses":["..."],"summary":"one sentence"}\nNo extra text. matchPercent should reflect fit against the role independently.';
        logPrompt(`/compare — candidate (app ${app.id})`, candidateSystem, prompt);

        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 512,
          system: candidateSystem,
          messages: [{ role: "user", content: prompt }],
        });

        const text = message.content[0].type === "text" ? message.content[0].text : "";
        try {
          analysis = JSON.parse(extractJson(text)) as CandidateAnalysis;
        } catch {
          analysis = { matchPercent: 0, strengths: [], weaknesses: [], summary: "Could not parse AI response." };
        }

        candidateCache.set(app.id, analysis);
      }

      summaries.push({ applicationId: app.id, matchPercent: analysis.matchPercent, summary: analysis.summary });
      res.write(JSON.stringify({ type: "candidate", applicationId: app.id, ...analysis }) + "\n");
    }

    // Best-overall (cached per sorted set of IDs)
    const cacheKey = bestCacheKey(applicationIds as number[]);
    let best = forceRefresh ? undefined : bestCache.get(cacheKey);

    if (!best) {
      const summaryText = summaries.map((s) => `ID ${s.applicationId}: ${s.matchPercent}% match — ${s.summary}`).join("\n");

      const bestSystem = 'You are an HR analyst. Given these candidate analyses, pick the best overall match.\nRespond ONLY with valid JSON: {"applicationId":<id>,"reason":"one concise sentence"}';
      const bestUser = `Role: ${role.name}\n\nCandidates:\n${summaryText}\n\nWhich candidate is the best overall match?`;
      logPrompt(`/compare — best-match`, bestSystem, bestUser);

      const bestMessage = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 256,
        system: bestSystem,
        messages: [{ role: "user", content: bestUser }],
      });

      const bestText = bestMessage.content[0].type === "text" ? bestMessage.content[0].text : "";
      try {
        best = JSON.parse(extractJson(bestText)) as BestAnalysis;
      } catch {
        best = { applicationId: summaries[0].applicationId, reason: "Could not determine best match." };
      }

      bestCache.set(cacheKey, best);
    }

    res.write(JSON.stringify({ type: "best", applicationId: best.applicationId, reason: best.reason }) + "\n");
    res.end();
  } catch (err) {
    next(err);
  }
});

export default router;
