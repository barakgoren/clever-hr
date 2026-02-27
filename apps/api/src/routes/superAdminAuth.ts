import { Router, Request, Response, NextFunction } from 'express';
import { superAdminLoginSchema } from '@repo/shared';
import { superAdminService } from '../services/superAdmin.service';

const router = Router();

const COOKIE_NAME = 'superadmin_refresh_token';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// POST /api/superadmin/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = superAdminLoginSchema.parse(req.body);
    const result = await superAdminService.login(body.username, body.password);
    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS);
    res.json({ success: true, data: { accessToken: result.accessToken, superAdmin: result.superAdmin } });
  } catch (err) {
    next(err);
  }
});

// POST /api/superadmin/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      res.status(401).json({ success: false, error: 'No refresh token' });
      return;
    }
    const result = await superAdminService.refresh(token);
    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS);
    res.json({ success: true, data: { accessToken: result.accessToken, superAdmin: result.superAdmin } });
  } catch (err) {
    next(err);
  }
});

// POST /api/superadmin/auth/logout
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) await superAdminService.logout(token);
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
