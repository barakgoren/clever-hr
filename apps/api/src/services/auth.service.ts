import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { AppError } from '../middleware/errorHandler';

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(401, 'Invalid email or password');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Invalid email or password');

    const accessToken = signAccessToken({
      userId: user.id,
      companyId: user.companyId,
      role: user.role as 'admin' | 'user',
    });

    const refreshTokenValue = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshTokenValue, expiresAt },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId },
    };
  },

  async refresh(refreshTokenValue: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new AppError(401, 'Refresh token expired or invalid');
    }

    // Rotate token
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const newAccessToken = signAccessToken({
      userId: stored.user.id,
      companyId: stored.user.companyId,
      role: stored.user.role as 'admin' | 'user',
    });

    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: { userId: stored.user.id, token: newRefreshToken, expiresAt },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshTokenValue: string) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshTokenValue } });
  },
};
