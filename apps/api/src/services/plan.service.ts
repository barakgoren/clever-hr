import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { PLAN_LIMITS } from '@repo/shared';
import type { Plan, CompanyUsage } from '@repo/shared';

async function getCompanyPlan(companyId: number): Promise<Plan> {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    select: { plan: true },
  });
  return company.plan as Plan;
}

function getMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export const planService = {
  async checkEmailLimit(companyId: number): Promise<void> {
    const plan = await getCompanyPlan(companyId);
    const limit = PLAN_LIMITS[plan].emailsPerMonth;
    if (limit === null) return;

    const count = await prisma.applicationEmail.count({
      where: { companyId, status: 'sent', createdAt: { gte: getMonthStart() } },
    });

    if (count >= limit) {
      throw new AppError(403, `Monthly email limit of ${limit} reached for your plan`);
    }
  },

  async checkStageLimit(companyId: number, roleId: number): Promise<void> {
    const plan = await getCompanyPlan(companyId);
    const limit = PLAN_LIMITS[plan].stagesPerRole;
    if (limit === null) return;

    const role = await prisma.role.findFirst({ where: { id: roleId, companyId } });
    if (!role) throw new AppError(404, 'Role not found');

    const count = await prisma.stage.count({ where: { roleId } });

    if (count >= limit) {
      throw new AppError(403, `Stage limit of ${limit} per role reached for your plan`);
    }
  },

  async checkActiveRoleLimit(companyId: number): Promise<void> {
    const plan = await getCompanyPlan(companyId);
    const limit = PLAN_LIMITS[plan].activeRoles;
    if (limit === null) return;

    const count = await prisma.role.count({ where: { companyId, isActive: true } });

    if (count >= limit) {
      throw new AppError(403, `Active role limit of ${limit} reached for your plan`);
    }
  },

  async getUsage(companyId: number): Promise<CompanyUsage> {
    const plan = await getCompanyPlan(companyId);
    const limits = PLAN_LIMITS[plan];
    const monthStart = getMonthStart();

    const [emailCount, activeRoleCount, roles] = await Promise.all([
      prisma.applicationEmail.count({
        where: { companyId, status: 'sent', createdAt: { gte: monthStart } },
      }),
      prisma.role.count({ where: { companyId, isActive: true } }),
      prisma.role.findMany({
        where: { companyId },
        select: { id: true, name: true, _count: { select: { stages: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      plan,
      limits,
      usage: {
        emailsSentThisMonth: emailCount,
        activeRoles: activeRoleCount,
        stagesPerRole: roles.map((r) => ({
          roleId: r.id,
          roleName: r.name,
          stageCount: r._count.stages,
        })),
      },
    };
  },
};
