import { Request, Response, NextFunction } from 'express';
import { getPrismaConstraintFields } from '../lib/prismaErrors';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err.name === 'AppError') {
    const appErr = err as AppError;
    res.status(appErr.statusCode).json({ success: false, error: appErr.message });
    return;
  }

  if (err.name === 'ZodError') {
    res.status(400).json({ success: false, error: 'Validation error', details: err });
    return;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
    return;
  }

  // Prisma P2002 — unique constraint violation
  if ((err as any)?.code === 'P2002') {
    const fields = getPrismaConstraintFields(err);
    const label = fields.length ? fields.join(', ') : 'field';
    res.status(409).json({ success: false, error: `${label} already in use` });
    return;
  }

  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
}
