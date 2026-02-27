import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { companyService } from '../services/company.service';
import { planService } from '../services/plan.service';
import { s3Service } from '../services/s3.service';
import { updateCompanySchema } from '@repo/shared';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const company = await companyService.getById(req.user!.companyId);
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
});

router.get('/usage', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const usage = await planService.getUsage(req.user!.companyId);
    res.json({ success: true, data: usage });
  } catch (err) {
    next(err);
  }
});

router.patch('/', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = updateCompanySchema.parse(req.body);
    const company = await companyService.update(req.user!.companyId, body);
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
});

router.post('/hero', requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, error: 'File required' }); return; }
    const key = s3Service.keys.heroImage(req.user!.companyId, req.file.originalname);
    await s3Service.upload(key, req.file.buffer, req.file.mimetype);
    const url = s3Service.publicUrl(key);
    const company = await companyService.updateHero(req.user!.companyId, url);
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
});

router.post('/logo', requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, error: 'File required' }); return; }
    const key = s3Service.keys.logoImage(req.user!.companyId, req.file.originalname);
    await s3Service.upload(key, req.file.buffer, req.file.mimetype);
    const url = s3Service.publicUrl(key);
    const company = await companyService.updateLogo(req.user!.companyId, url);
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
});

export default router;
