import { Response, NextFunction, Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/ai/email-template
// Streams an email template body based on name + subject
router.post('/email-template', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, subject } = req.body as { name?: string; subject?: string };
    if (!name?.trim()) {
      res.status(400).json({ success: false, error: 'Template name is required' });
      return;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if present

    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are an HR professional writing reusable email templates for candidate communication.

Generate a professional email template body for the following:
Template name: ${name.trim()}${subject?.trim() ? `\nSubject: ${subject.trim()}` : ''}

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
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(event.delta.text);
      }
    }

    res.end();
  } catch (err) {
    next(err);
  }
});

export default router;
