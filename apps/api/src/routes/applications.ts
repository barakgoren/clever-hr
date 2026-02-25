import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { applicationService } from '../services/application.service';
import { addApplicationTimelineSchema, moveApplicationStageSchema, sendEmailSchema } from '@repo/shared';
import { previewEmail, sendEmail } from '../services/email.service';
import { emailTemplateService } from '../services/emailTemplate.service';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = Router();
router.use(requireAuth);

router.get('/export', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const csv = await applicationService.exportCsv(req.user!.companyId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="applications.csv"');
    res.send(csv);
  } catch (err) { next(err); }
});

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { roleId, search } = z.object({
      roleId: z.coerce.number().int().optional(),
      search: z.string().optional(),
    }).parse(req.query);
    const applications = await applicationService.list(req.user!.companyId, { roleId, search });
    res.json({ success: true, data: applications });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const app = await applicationService.getById(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, data: app });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await applicationService.delete(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch('/:id/stage', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { stageId } = moveApplicationStageSchema.parse(req.body);
    const app = await applicationService.moveStage(parseInt(req.params.id), req.user!.companyId, stageId);
    res.json({ success: true, data: app });
  } catch (err) { next(err); }
});

router.get('/:id/files/:fieldId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const url = await applicationService.getFilePresignedUrl(
      parseInt(req.params.id),
      req.user!.companyId,
      req.params.fieldId
    );
    res.json({ success: true, data: { url } });
  } catch (err) { next(err); }
});

router.post('/:id/timeline', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = addApplicationTimelineSchema.parse(req.body);
    const app = await applicationService.addTimelineEntry(
      parseInt(req.params.id),
      req.user!.companyId,
      { stageId: body.stageId, description: body.description }
    );
    res.status(201).json({ success: true, data: app });
  } catch (err) { next(err); }
});

// Send an email to the applicant
router.post('/:id/email', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { to, subject, body, templateId } = sendEmailSchema.parse(req.body);
    const application = await applicationService.getById(
      parseInt(req.params.id),
      req.user!.companyId
    );

    let finalSubject = subject;
    let finalBody = body;

    // If a saved template is requested, merge its content
    if (templateId) {
      const tmpl = await emailTemplateService.getById(templateId, req.user!.companyId);
      finalSubject = tmpl.subject;
      finalBody = tmpl.body;
    }

    const fd = application.formData as Record<string, string>;
    const candidateName = fd.full_name ?? to;
    const roleName = application.role?.name ?? '';

    const [sender, company] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user!.userId }, select: { name: true } }),
      prisma.company.findUnique({ where: { id: req.user!.companyId }, select: { name: true, logoUrl: true } }),
    ]);

    const replacements: Record<string, string> = {
      candidateName: candidateName ?? '',
      roleName,
      companyName: company?.name ?? '',
    };

    const interpolate = (text: string) =>
      text.replace(/{{\s*(candidateName|roleName|companyName)\s*}}/g, (_m, key: keyof typeof replacements) =>
        replacements[key] ?? ''
      );

    const interpolatedSubject = interpolate(finalSubject);
    const interpolatedBody = interpolate(finalBody);

    const senderDisplayName = company?.name ?? sender?.name ?? 'HR Team';

    const html = previewEmail('custom-message', {
      candidateName,
      companyName: replacements.companyName,
      logoUrl: company?.logoUrl ?? null,
      senderName: senderDisplayName,
      body: interpolatedBody,
      subject: interpolatedSubject,
    });

    const sendResult = await sendEmail({
      to,
      subject: interpolatedSubject,
      templateName: 'custom-message',
      senderName: senderDisplayName,
      context: {
        candidateName,
        companyName: replacements.companyName,
        logoUrl: company?.logoUrl ?? null,
        senderName: senderDisplayName,
        body: interpolatedBody,
      },
      renderedHtml: html,
    });

    await prisma.applicationEmail.create({
      data: {
        applicationId: application.id,
        companyId: req.user!.companyId,
        senderUserId: req.user!.userId,
        to,
        subject: interpolatedSubject,
        body: interpolatedBody,
        html,
        templateId: templateId ?? null,
        status: sendResult.error ? 'failed' : 'sent',
        error: sendResult.error ?? null,
      },
    });

    res.json({ success: true, data: { status: sendResult.error ? 'failed' : 'sent' } });
  } catch (err) { next(err); }
});

export default router;
