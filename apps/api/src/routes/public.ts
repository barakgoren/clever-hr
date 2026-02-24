import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import prisma from '../lib/prisma';
import { applicationService } from '../services/application.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/public/:companySlug
router.get('/:companySlug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await prisma.company.findUnique({ where: { slug: req.params.companySlug } });
    if (!company) throw new AppError(404, 'Company not found');

    const roles = await prisma.role.findMany({
      where: { companyId: company.id, isActive: true },
      select: { id: true, name: true, description: true, location: true, type: true, seniorityLevel: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { company: { id: company.id, name: company.name, slug: company.slug, description: company.description, heroImageUrl: company.heroImageUrl, logoUrl: company.logoUrl }, roles } });
  } catch (err) { next(err); }
});

// GET /api/public/:companySlug/roles/:roleId
router.get('/:companySlug/roles/:roleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await prisma.company.findUnique({ where: { slug: req.params.companySlug } });
    if (!company) throw new AppError(404, 'Company not found');

    const role = await prisma.role.findFirst({
      where: { id: parseInt(req.params.roleId), companyId: company.id, isActive: true },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    if (!role) throw new AppError(404, 'Role not found');

    res.json({ success: true, data: role });
  } catch (err) { next(err); }
});

// POST /api/public/:companySlug/roles/:roleId/apply
router.post('/:companySlug/roles/:roleId/apply', upload.single('resume'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await prisma.company.findUnique({ where: { slug: req.params.companySlug } });
    if (!company) throw new AppError(404, 'Company not found');

    const role = await prisma.role.findFirst({
      where: { id: parseInt(req.params.roleId), companyId: company.id, isActive: true },
    });
    if (!role) throw new AppError(404, 'Role not found or no longer accepting applications');

    const { full_name, email, ...rest } = req.body;
    if (!full_name || !email) throw new AppError(400, 'full_name and email are required');

    const formData = { full_name, email, ...rest };

    const application = await applicationService.submit(
      role.id,
      company.id,
      formData,
      req.file
        ? { buffer: req.file.buffer, originalname: req.file.originalname, mimetype: req.file.mimetype }
        : undefined
    );

    res.status(201).json({ success: true, data: { id: application.id } });
  } catch (err) { next(err); }
});

export default router;
