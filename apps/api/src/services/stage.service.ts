import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const stageService = {
  async list(roleId: number, companyId: number) {
    const role = await prisma.role.findFirst({ where: { id: roleId, companyId } });
    if (!role) throw new AppError(404, 'Role not found');
    return prisma.stage.findMany({ where: { roleId }, orderBy: { order: 'asc' } });
  },

  async create(
    roleId: number,
    companyId: number,
    data: { name: string; order?: number; color?: string; icon?: string }
  ) {
    const role = await prisma.role.findFirst({ where: { id: roleId, companyId } });
    if (!role) throw new AppError(404, 'Role not found');

    const maxOrder = await prisma.stage.aggregate({ where: { roleId }, _max: { order: true } });
    const order = data.order ?? (maxOrder._max.order ?? 0) + 1;

    return prisma.stage.create({
      data: {
        roleId,
        name: data.name,
        order,
        color: data.color ?? '#6366f1',
        icon: data.icon ?? 'flag',
      },
    });
  },

  async update(
    id: number,
    roleId: number,
    companyId: number,
    data: { name?: string; order?: number; color?: string; icon?: string }
  ) {
    const stage = await prisma.stage.findFirst({
      where: { id, roleId },
      include: { role: true },
    });
    if (!stage || stage.role.companyId !== companyId) throw new AppError(404, 'Stage not found');
    return prisma.stage.update({ where: { id }, data });
  },

  async delete(id: number, roleId: number, companyId: number) {
    const stage = await prisma.stage.findFirst({
      where: { id, roleId },
      include: { role: true },
    });
    if (!stage || stage.role.companyId !== companyId) throw new AppError(404, 'Stage not found');

    // Null out applications referencing this stage
    await prisma.application.updateMany({
      where: { currentStageId: id },
      data: { currentStageId: null },
    });

    await prisma.stage.delete({ where: { id } });
  },
};
