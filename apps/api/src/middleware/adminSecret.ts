import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export function requireAdminSecret(req: Request, _res: Response, next: NextFunction): void {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return next(new AppError(401, 'Invalid admin secret'));
  }
  next();
}
