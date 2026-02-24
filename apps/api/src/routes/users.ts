import { Router, Response, NextFunction } from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { userService } from '../services/user.service';
import { createUserSchema, updateUserSchema } from '@repo/shared';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await userService.list(req.user!.companyId);
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

router.post('/', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = createUserSchema.parse(req.body);
    const user = await userService.create(req.user!.companyId, body);
    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.patch('/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = updateUserSchema.parse(req.body);
    const user = await userService.update(parseInt(req.params.id), req.user!.companyId, body);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await userService.delete(parseInt(req.params.id), req.user!.companyId, req.user!.userId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/:id/message', async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { message: 'Message feature coming soon' } });
});

export default router;
