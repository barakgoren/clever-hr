import prisma from '../lib/prisma';
import { PLAN_LIMITS } from '@repo/shared';

function getMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export const superAdminStatsService = {
  async getStats() {
    const [companiesByPlan, totalUsers] = await Promise.all([
      prisma.company.groupBy({ by: ['plan'], _count: { id: true } }),
      prisma.user.count(),
    ]);
    const byPlan: Record<string, number> = { team: 0, ultimate: 0 };
    for (const g of companiesByPlan) byPlan[g.plan] = g._count.id;
    return {
      totalCompanies: byPlan.team + byPlan.ultimate,
      byPlan,
      totalUsers,
    };
  },

  async getEmailUsage() {
    const monthStart = getMonthStart();

    const [companies, emailCounts] = await Promise.all([
      prisma.company.findMany({
        select: { id: true, name: true, slug: true, plan: true },
        orderBy: { name: 'asc' },
      }),
      prisma.applicationEmail.groupBy({
        by: ['companyId'],
        where: { status: 'sent', createdAt: { gte: monthStart } },
        _count: { id: true },
      }),
    ]);

    const countByCompany = new Map(emailCounts.map((e) => [e.companyId, e._count.id]));

    const rows = companies.map((c) => {
      const sent = countByCompany.get(c.id) ?? 0;
      const limit = PLAN_LIMITS[c.plan as 'team' | 'ultimate'].emailsPerMonth;
      return { id: c.id, name: c.name, slug: c.slug, plan: c.plan, sent, limit };
    });

    const totalSent = rows.reduce((sum, r) => sum + r.sent, 0);
    return { monthStart: monthStart.toISOString(), totalSent, companies: rows };
  },
};
