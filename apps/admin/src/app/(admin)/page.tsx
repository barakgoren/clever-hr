'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, BarChart2 } from 'lucide-react';

async function fetchStats() {
  const { data } = await apiClient.get('/api/superadmin/stats');
  return data.data as { totalCompanies: number; byPlan: { team: number; ultimate: number }; totalUsers: number };
}

export default function OverviewPage() {
  const { data, isLoading } = useQuery({ queryKey: ['stats'], queryFn: fetchStats });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Building2} label="Total Companies" value={data?.totalCompanies ?? 0} />
          <StatCard
            icon={BarChart2}
            label="Plans"
            value={`${data?.byPlan.team ?? 0} Team / ${data?.byPlan.ultimate ?? 0} Ultimate`}
          />
          <StatCard icon={Users} label="Total Users" value={data?.totalUsers ?? 0} />
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand-100)]">
          <Icon className="h-5 w-5 text-[var(--color-brand-600)]" />
        </div>
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}
