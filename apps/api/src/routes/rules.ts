import { Response, NextFunction, Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { ruleService } from '../services/rule.service';
import { createRuleSchema, updateRuleSchema } from '@repo/shared';

const router = Router({ mergeParams: true });

// GET /api/roles/:roleId/rules
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const roleId = parseInt(req.params.roleId);
    const companyId = req.user!.companyId;
    const rules = await ruleService.list(roleId, companyId);
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
});

// POST /api/roles/:roleId/rules
router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const roleId = parseInt(req.params.roleId);
    const companyId = req.user!.companyId;
    const parsed = createRuleSchema.parse(req.body);
    const rule = await ruleService.create(roleId, companyId, parsed);
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/roles/:roleId/rules/:id
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const companyId = req.user!.companyId;
    const parsed = updateRuleSchema.parse(req.body);
    const rule = await ruleService.update(id, companyId, parsed);
    res.json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/roles/:roleId/rules/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const companyId = req.user!.companyId;
    await ruleService.delete(id, companyId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
