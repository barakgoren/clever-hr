'use client';

import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { PLAN_LIMITS } from '@repo/shared';
import type { Plan, PlanLimits, CompanyUsage } from '@repo/shared';

export interface UsePlanResult {
  plan: Plan | undefined;
  limits: PlanLimits | undefined;
  usage: CompanyUsage['usage'] | undefined;
  isLoading: boolean;
  isAtEmailLimit: boolean;
  isAtActiveRoleLimit: boolean;
  stagesAtLimit: (roleId: number) => boolean;
}

export function usePlan(): UsePlanResult {
  const { data, isLoading } = useQuery({
    queryKey: ['company-usage'],
    queryFn: companyService.getUsage,
    staleTime: 30_000,
  });

  const limits = data ? PLAN_LIMITS[data.plan] : undefined;
  const usage = data?.usage;

  return {
    plan: data?.plan,
    limits,
    usage,
    isLoading,
    isAtEmailLimit:
      limits?.emailsPerMonth != null &&
      (usage?.emailsSentThisMonth ?? 0) >= limits.emailsPerMonth,
    isAtActiveRoleLimit:
      limits?.activeRoles != null &&
      (usage?.activeRoles ?? 0) >= limits.activeRoles,
    stagesAtLimit: (roleId: number) => {
      if (!limits?.stagesPerRole) return false;
      const entry = usage?.stagesPerRole.find((r) => r.roleId === roleId);
      return (entry?.stageCount ?? 0) >= limits.stagesPerRole!;
    },
  };
}
