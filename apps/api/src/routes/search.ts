import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { z } from 'zod';
import type { SearchResult } from '@repo/shared';
import { ruleService } from '../services/rule.service';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q } = z.object({ q: z.string().min(1).max(100) }).parse(req.query);
    const companyId = req.user!.companyId;
    const term = q.trim();

    const [roles, applications, emailTemplates] = await Promise.all([
      prisma.role.findMany({
        where: {
          companyId,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { location: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, color: true, type: true, location: true, isActive: true },
        take: 5,
      }),
      prisma.application.findMany({
        where: {
          companyId,
          OR: [
            { formData: { path: ['full_name'], string_contains: term } },
            { formData: { path: ['email'], string_contains: term } },
            { role: { name: { contains: term, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          formData: true,
          roleId: true,
          role: { select: { id: true, name: true, color: true } },
          currentStage: { select: { name: true, color: true } },
        },
        take: 5,
      }),
      prisma.emailTemplate.findMany({
        where: {
          companyId,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { subject: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, subject: true },
        take: 5,
      }),
    ]);

    // Fetch rules for scoring applications
    const roleIds = [...new Set(applications.map((a) => a.roleId))];
    const rules = roleIds.length
      ? await prisma.rule.findMany({ where: { roleId: { in: roleIds }, companyId } })
      : [];
    const rulesByRole = new Map<number, typeof rules>();
    for (const rule of rules) {
      if (!rulesByRole.has(rule.roleId)) rulesByRole.set(rule.roleId, []);
      rulesByRole.get(rule.roleId)!.push(rule);
    }

    const results: SearchResult[] = [
      ...roles.map((r) => ({
        type: 'role' as const,
        id: r.id,
        title: r.name,
        subtitle: [r.location, r.type?.replace('_', ' ')].filter(Boolean).join(' · ') || undefined,
        color: r.color,
        isActive: r.isActive,
      })),
      ...applications.map((a) => {
        const fd = a.formData as Record<string, string>;
        const roleRules = rulesByRole.get(a.roleId) ?? [];
        const { totalScore } = ruleService.evaluateRulesForApplication(
          { resumeS3Key: null, formData: fd as Record<string, string | boolean>, extractedTexts: {} },
          roleRules
        );
        return {
          type: 'application' as const,
          id: a.id,
          title: fd.full_name ?? fd.email ?? `Application #${a.id}`,
          roleColor: a.role?.color,
          roleName: a.role?.name,
          stageName: a.currentStage?.name ?? undefined,
          stageColor: a.currentStage?.color ?? undefined,
          score: totalScore || undefined,
        };
      }),
      ...emailTemplates.map((t) => ({
        type: 'emailTemplate' as const,
        id: t.id,
        title: t.name,
        subtitle: t.subject ?? undefined,
      })),
    ];

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

export default router;
