import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { CreateRoleInput, UpdateRoleInput, CustomField } from '@repo/shared';

const SYSTEM_FIELDS: CustomField[] = [
  { id: 'full_name', label: 'Full Name', type: 'text', required: true, system: true },
  { id: 'email', label: 'Email', type: 'email', required: true, system: true },
];

function ensureSystemFields(customFields: CustomField[]): CustomField[] {
  const submittedById = new Map(customFields.map((f) => [f.id, f]));
  // Preserve label edits made by the user; always keep system: true and required: true
  const systemFields = SYSTEM_FIELDS.map((def) => {
    const submitted = submittedById.get(def.id);
    return submitted ? { ...def, label: submitted.label } : def;
  });
  const nonSystemFields = customFields.filter((f) => !SYSTEM_FIELDS.some((s) => s.id === f.id));
  return [...systemFields, ...nonSystemFields];
}

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
    const customFields = ensureSystemFields(data.customFields as CustomField[]);
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
        customFields: customFields as object[],
      },
      include: { stages: true },
    });
  },

  async update(id: number, companyId: number, data: UpdateRoleInput) {
    await this.getById(id, companyId);
    const customFields = data.customFields
      ? ensureSystemFields(data.customFields as CustomField[])
      : undefined;
    return prisma.role.update({
      where: { id },
      data: {
        ...data,
        customFields: customFields ? (customFields as object[]) : undefined,
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
