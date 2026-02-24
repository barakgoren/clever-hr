import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { applicationService } from '../services/application.service';
import { moveApplicationStageSchema } from '@repo/shared';
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

export default router;
