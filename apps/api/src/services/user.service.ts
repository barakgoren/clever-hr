import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { CreateUserInput, UpdateUserInput } from '@repo/shared';

export const userService = {
  async list(companyId: number) {
    return prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true, username: true, email: true, role: true, companyId: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  async getById(id: number, companyId: number) {
    const user = await prisma.user.findFirst({
      where: { id, companyId },
      select: { id: true, name: true, username: true, email: true, role: true, companyId: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new AppError(404, 'User not found');
    return user;
  },

  async create(companyId: number, data: CreateUserInput) {
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (exists) throw new AppError(409, 'Email or username already taken');

    const passwordHash = await bcrypt.hash(data.password, 12);
    return prisma.user.create({
      data: { companyId, name: data.name, username: data.username, email: data.email, passwordHash, role: data.role },
      select: { id: true, name: true, username: true, email: true, role: true, companyId: true, createdAt: true, updatedAt: true },
    });
  },

  async update(id: number, companyId: number, data: UpdateUserInput) {
    await this.getById(id, companyId);

    const updateData: Record<string, unknown> = { ...data };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
      delete updateData.password;
    }
    return prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, username: true, email: true, role: true, companyId: true, createdAt: true, updatedAt: true },
    });
  },

  async delete(id: number, companyId: number, requestingUserId: number) {
    if (id === requestingUserId) throw new AppError(400, 'Cannot delete your own account');
    await this.getById(id, companyId);
    await prisma.user.delete({ where: { id } });
  },
};
