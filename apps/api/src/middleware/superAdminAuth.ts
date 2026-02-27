import { Request, Response, NextFunction } from 'express';
import { verifySuperAdminAccessToken, SuperAdminTokenPayload } from '../lib/jwt';
import { AppError } from './errorHandler';

export interface SuperAdminRequest extends Request {
  superAdmin?: SuperAdminTokenPayload;
}

export function requireSuperAdmin(req: SuperAdminRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next(new AppError(401, 'Authorization token required'));
  try {
    req.superAdmin = verifySuperAdminAccessToken(authHeader.slice(7));
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}
