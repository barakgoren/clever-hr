'use client';

import { usePlan } from '@/hooks/usePlan';
import { Skeleton } from '@/components/ui/skeleton';

function ProgressBar({ value, max, color }: { value: number; max: number; color: 'green' | 'amber' | 'red' }) {
  const pct = Math.min((value / max) * 100, 100);
  const colorClass = color === 'red' ? 'bg-red-500' : color === 'amber' ? 'bg-amber-400' : 'bg-green-500';
  return (
    <div className="h-2 w-full rounded-full bg-[var(--color-surface-subtle)] overflow-hidden">
      <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function getBarColor(value: number, max: number): 'green' | 'amber' | 'red' {
  const pct = value / max;
  if (pct >= 1) return 'red';
  if (pct >= 0.8) return 'amber';
  return 'green';
}

export default function UsagePage() {
  const { plan, limits, usage, isLoading } = usePlan();

  const planLabel = plan === 'ultimate' ? 'Ultimate' : 'Team';

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <Skeleton className="h-7 w-36 mb-1" />
          <Skeleton className="h-4 w-48" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Usage</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          Current plan: <span className="font-medium text-[var(--color-brand-600)]">{planLabel}</span>
        </p>
      </div>

      {/* Emails this month */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Emails This Month</h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${limits?.emailsPerMonth != null && usage && usage.emailsSentThisMonth >= limits.emailsPerMonth ? 'text-red-600' : 'text-[var(--color-text-muted)]'}`}>
              {usage?.emailsSentThisMonth ?? 0}{limits?.emailsPerMonth != null ? ` / ${limits.emailsPerMonth}` : ' sent'}
            </span>
            {limits?.emailsPerMonth == null && (
              <span className="rounded-full bg-[var(--color-brand-100)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-brand-700)]">Unlimited</span>
            )}
          </div>
        </div>

        {limits?.emailsPerMonth != null && usage ? (
          <>
            <ProgressBar
              value={usage.emailsSentThisMonth}
              max={limits.emailsPerMonth}
              color={getBarColor(usage.emailsSentThisMonth, limits.emailsPerMonth)}
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Resets on the 1st of each month. Only successfully sent emails count.
            </p>
          </>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)]">
            Resets on the 1st of each month. Only successfully sent emails count.
          </p>
        )}
      </div>

      {/* Active roles */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Active Roles</h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${limits?.activeRoles != null && usage && usage.activeRoles >= limits.activeRoles ? 'text-red-600' : 'text-[var(--color-text-muted)]'}`}>
              {usage?.activeRoles ?? 0}{limits?.activeRoles != null ? ` / ${limits.activeRoles}` : ' active'}
            </span>
            {limits?.activeRoles == null && (
              <span className="rounded-full bg-[var(--color-brand-100)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-brand-700)]">Unlimited</span>
            )}
          </div>
        </div>

        {limits?.activeRoles != null && usage ? (
          <ProgressBar
            value={usage.activeRoles}
            max={limits.activeRoles}
            color={getBarColor(usage.activeRoles, limits.activeRoles)}
          />
        ) : null}
      </div>

      {/* Stages per role */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Stages per Role</h2>
          {limits?.stagesPerRole != null ? (
            <span className="text-xs text-[var(--color-text-muted)]">Max {limits.stagesPerRole} per role</span>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">Unlimited</span>
          )}
        </div>

        {usage && usage.stagesPerRole.length > 0 ? (
          <div className="divide-y divide-[var(--color-border)]">
            {usage.stagesPerRole.map((r) => {
              const atLimit = limits?.stagesPerRole != null && r.stageCount >= limits.stagesPerRole;
              return (
                <div key={r.roleId} className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--color-text-primary)] truncate max-w-[60%]">{r.roleName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {r.stageCount}{limits?.stagesPerRole != null ? ` / ${limits.stagesPerRole}` : ''} stages
                    </span>
                    {atLimit && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        At limit
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)]">No roles created yet.</p>
        )}
      </div>
    </div>
  );
}
