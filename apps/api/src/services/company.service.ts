import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { UpdateCompanyInput } from '@repo/shared';

export const companyService = {
  async getById(companyId: number) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new AppError(404, 'Company not found');
    return company;
  },

  async getBySlug(slug: string) {
    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company) throw new AppError(404, 'Company not found');
    return company;
  },

  async update(companyId: number, data: UpdateCompanyInput) {
    if (data.slug) {
      const existing = await prisma.company.findFirst({
        where: { slug: data.slug, id: { not: companyId } },
      });
      if (existing) throw new AppError(409, 'Slug already taken');
    }
    return prisma.company.update({ where: { id: companyId }, data });
  },

  async updateLogo(companyId: number, logoUrl: string) {
    return prisma.company.update({ where: { id: companyId }, data: { logoUrl } });
  },

  async updateHero(companyId: number, heroImageUrl: string) {
    return prisma.company.update({ where: { id: companyId }, data: { heroImageUrl } });
  },

  async create(data: { name: string; slug: string; description?: string }) {
    const existing = await prisma.company.findUnique({ where: { slug: data.slug } });
    if (existing) throw new AppError(409, 'Slug already taken');
    return prisma.company.create({ data });
  },
};
