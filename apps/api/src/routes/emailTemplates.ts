import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { emailTemplateService } from '../services/emailTemplate.service';
import { createEmailTemplateSchema, updateEmailTemplateSchema } from '@repo/shared';

const router = Router();
router.use(requireAuth);

// List all email templates for the company
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const templates = await emailTemplateService.list(req.user!.companyId);
    res.json({ success: true, data: templates });
  } catch (err) { next(err); }
});

// Get a single template
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const template = await emailTemplateService.getById(
      parseInt(req.params.id),
      req.user!.companyId
    );
    res.json({ success: true, data: template });
  } catch (err) { next(err); }
});

// Create a new email template
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createEmailTemplateSchema.parse(req.body);
    const template = await emailTemplateService.create(req.user!.companyId, data);
    res.status(201).json({ success: true, data: template });
  } catch (err) { next(err); }
});

// Update an email template
router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateEmailTemplateSchema.parse(req.body);
    const template = await emailTemplateService.update(
      parseInt(req.params.id),
      req.user!.companyId,
      data
    );
    res.json({ success: true, data: template });
  } catch (err) { next(err); }
});

// Delete an email template
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await emailTemplateService.delete(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
