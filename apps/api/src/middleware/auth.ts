import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../lib/jwt';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: AccessTokenPayload;
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authorization token required'));
  }
  const token = authHeader.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    return next(new AppError(403, 'Admin access required'));
  }
  next();
}
