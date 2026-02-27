export type Plan = 'team' | 'ultimate';

export interface PlanLimits {
  emailsPerMonth: number | null;
  stagesPerRole: number | null;
  activeRoles: number | null;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  team:     { emailsPerMonth: 50, stagesPerRole: 4, activeRoles: 5 },
  ultimate: { emailsPerMonth: null, stagesPerRole: null, activeRoles: null },
};

export interface CompanyUsage {
  plan: Plan;
  limits: PlanLimits;
  usage: {
    emailsSentThisMonth: number;
    activeRoles: number;
    stagesPerRole: Array<{ roleId: number; roleName: string; stageCount: number }>;
  };
}
