import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { requireAdminSecret } from '../middleware/adminSecret';
import { companyService } from '../services/company.service';
import prisma from '../lib/prisma';

const router = Router();
router.use(requireAdminSecret);

// POST /api/admin/bootstrap
router.post('/bootstrap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company, user } = req.body as {
      company?: { name?: string; slug?: string; description?: string };
      user?: { name?: string; username?: string; email?: string; password?: string; role?: string };
    };

    if (!company?.name || !company?.slug || !user?.name || !user?.username || !user?.email || !user?.password) {
      res.status(400).json({ success: false, error: 'company.name, company.slug, user.name, user.username, user.email, user.password are required' });
      return;
    }

    const createdCompany = await companyService.create({ name: company.name, slug: company.slug, description: company.description });
    const passwordHash = await bcrypt.hash(user.password, 12);
    const createdUser = await prisma.user.create({
      data: {
        companyId: createdCompany.id,
        name: user.name,
        username: user.username,
        email: user.email,
        passwordHash,
        role: (user.role === 'user' ? 'user' : 'admin'),
      },
      select: { id: true, name: true, username: true, email: true, role: true, companyId: true, createdAt: true },
    });

    res.status(201).json({ success: true, data: { company: createdCompany, user: createdUser } });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/companies
router.post('/companies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, description } = req.body;
    const company = await companyService.create({ name, slug, description });
    res.status(201).json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/companies/:id/users
router.post('/companies/:id/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = parseInt(req.params.id);
    const { name, username, email, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { companyId, name, username, email, passwordHash, role: role ?? 'admin' },
      select: { id: true, name: true, username: true, email: true, role: true, companyId: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export default router;
