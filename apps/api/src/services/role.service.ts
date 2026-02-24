import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { CreateRoleInput, UpdateRoleInput } from '@repo/shared';

export const roleService = {
  async list(companyId: number) {
    return prisma.role.findMany({
      where: { companyId },
      include: { stages: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: number, companyId: number) {
    const role = await prisma.role.findFirst({
      where: { id, companyId },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    if (!role) throw new AppError(404, 'Role not found');
    return role;
  },

  async create(companyId: number, userId: number, data: CreateRoleInput) {
    return prisma.role.create({
      data: {
        companyId,
        createdByUserId: userId,
        name: data.name,
        description: data.description ?? null,
        location: data.location ?? null,
        type: data.type,
        seniorityLevel: data.seniorityLevel ?? null,
        requirements: data.requirements,
        customFields: data.customFields as object[],
      },
      include: { stages: true },
    });
  },

  async update(id: number, companyId: number, data: UpdateRoleInput) {
    await this.getById(id, companyId);
    return prisma.role.update({
      where: { id },
      data: {
        ...data,
        customFields: data.customFields ? (data.customFields as object[]) : undefined,
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  },

  async delete(id: number, companyId: number) {
    await this.getById(id, companyId);
    const appCount = await prisma.application.count({ where: { roleId: id } });
    if (appCount > 0) throw new AppError(400, `Cannot delete role with ${appCount} existing application(s). Deactivate it instead.`);
    await prisma.role.delete({ where: { id } });
  },

  async toggleActive(id: number, companyId: number, isActive: boolean) {
    await this.getById(id, companyId);
    return prisma.role.update({ where: { id }, data: { isActive } });
  },
};
