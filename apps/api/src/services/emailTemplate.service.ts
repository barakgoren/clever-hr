import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import type { CreateEmailTemplateInput, UpdateEmailTemplateInput } from '@repo/shared';

export const emailTemplateService = {
  async list(companyId: number) {
    return prisma.emailTemplate.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: number, companyId: number) {
    const template = await prisma.emailTemplate.findFirst({ where: { id, companyId } });
    if (!template) throw new AppError(404, 'Email template not found');
    return template;
  },

  async create(companyId: number, data: CreateEmailTemplateInput) {
    return prisma.emailTemplate.create({ data: { companyId, ...data } });
  },

  async update(id: number, companyId: number, data: UpdateEmailTemplateInput) {
    await this.getById(id, companyId);
    return prisma.emailTemplate.update({ where: { id }, data });
  },

  async delete(id: number, companyId: number) {
    await this.getById(id, companyId);
    await prisma.emailTemplate.delete({ where: { id } });
  },
};
