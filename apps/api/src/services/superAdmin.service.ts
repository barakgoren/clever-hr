import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { signSuperAdminAccessToken } from '../lib/jwt';
import { AppError } from '../middleware/errorHandler';

export const superAdminService = {
  async create(username: string, name: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 12);
    const sa = await prisma.superAdmin.create({
      data: { username, name, passwordHash },
      select: { id: true, username: true, name: true, createdAt: true, updatedAt: true },
    });
    return sa;
  },

  async login(username: string, password: string) {
    const sa = await prisma.superAdmin.findUnique({ where: { username } });
    if (!sa) throw new AppError(401, 'Invalid username or password');

    const valid = await bcrypt.compare(password, sa.passwordHash);
    if (!valid) throw new AppError(401, 'Invalid username or password');

    const accessToken = signSuperAdminAccessToken({ superAdminId: sa.id, role: 'superadmin' });

    const refreshTokenValue = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.superAdminRefreshToken.create({
      data: { superAdminId: sa.id, token: refreshTokenValue, expiresAt },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      superAdmin: { id: sa.id, username: sa.username, name: sa.name, createdAt: sa.createdAt, updatedAt: sa.updatedAt },
    };
  },

  async refresh(token: string) {
    const stored = await prisma.superAdminRefreshToken.findUnique({
      where: { token },
      include: { superAdmin: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.superAdminRefreshToken.delete({ where: { id: stored.id } });
      throw new AppError(401, 'Refresh token expired or invalid');
    }

    await prisma.superAdminRefreshToken.delete({ where: { id: stored.id } });

    const newAccessToken = signSuperAdminAccessToken({ superAdminId: stored.superAdmin.id, role: 'superadmin' });
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.superAdminRefreshToken.create({
      data: { superAdminId: stored.superAdmin.id, token: newRefreshToken, expiresAt },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      superAdmin: {
        id: stored.superAdmin.id,
        username: stored.superAdmin.username,
        name: stored.superAdmin.name,
        createdAt: stored.superAdmin.createdAt,
        updatedAt: stored.superAdmin.updatedAt,
      },
    };
  },

  async logout(token: string) {
    await prisma.superAdminRefreshToken.deleteMany({ where: { token } });
  },

  async list() {
    return prisma.superAdmin.findMany({
      select: { id: true, username: true, name: true, createdAt: true, updatedAt: true },
    });
  },
};
