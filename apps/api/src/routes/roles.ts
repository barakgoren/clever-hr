import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { roleService } from '../services/role.service';
import { stageService } from '../services/stage.service';
import { createRoleSchema, updateRoleSchema } from '@repo/shared';
import { z } from 'zod';

const router = Router();
router.use(requireAuth);

// Roles
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const roles = await roleService.list(req.user!.companyId);
    res.json({ success: true, data: roles });
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = createRoleSchema.parse(req.body);
    const role = await roleService.create(req.user!.companyId, req.user!.userId, body);
    res.status(201).json({ success: true, data: role });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const role = await roleService.getById(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, data: role });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = updateRoleSchema.parse(req.body);
    const role = await roleService.update(parseInt(req.params.id), req.user!.companyId, body);
    res.json({ success: true, data: role });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await roleService.delete(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch('/:id/active', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
    const role = await roleService.toggleActive(parseInt(req.params.id), req.user!.companyId, isActive);
    res.json({ success: true, data: role });
  } catch (err) { next(err); }
});

// Stages
router.get('/:roleId/stages', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stages = await stageService.list(parseInt(req.params.roleId), req.user!.companyId);
    res.json({ success: true, data: stages });
  } catch (err) { next(err); }
});

router.post('/:roleId/stages', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, order } = z.object({ name: z.string().min(1), order: z.number().int().optional() }).parse(req.body);
    const stage = await stageService.create(parseInt(req.params.roleId), req.user!.companyId, { name, order });
    res.status(201).json({ success: true, data: stage });
  } catch (err) { next(err); }
});

router.patch('/:roleId/stages/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = z.object({ name: z.string().min(1).optional(), order: z.number().int().optional() }).parse(req.body);
    const stage = await stageService.update(parseInt(req.params.id), parseInt(req.params.roleId), req.user!.companyId, data);
    res.json({ success: true, data: stage });
  } catch (err) { next(err); }
});

router.delete('/:roleId/stages/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await stageService.delete(parseInt(req.params.id), parseInt(req.params.roleId), req.user!.companyId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
