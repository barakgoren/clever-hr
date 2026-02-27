"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail } from "lucide-react";

interface CompanyEmailRow {
  id: number;
  name: string;
  slug: string;
  plan: string;
  sent: number;
  limit: number | null;
}

interface UsageData {
  monthStart: string;
  totalSent: number;
  companies: CompanyEmailRow[];
}

async function fetchUsage(): Promise<UsageData> {
  const { data } = await apiClient.get("/api/superadmin/usage");
  return data.data;
}

function monthLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function UsageBar({ sent, limit }: { sent: number; limit: number | null }) {
  if (limit === null) {
    return <span className="text-xs text-[var(--color-text-muted)]">{sent} / Unlimited</span>;
  }
  const pct = Math.min((sent / limit) * 100, 100);
  const color = pct >= 90 ? "bg-[var(--color-danger)]" : pct >= 70 ? "bg-[var(--color-warning)]" : "bg-[var(--color-brand-500)]";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-xs tabular-nums text-[var(--color-text-secondary)]">
        {sent} / {limit}
      </span>
    </div>
  );
}

export default function UsagePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["usage"],
    queryFn: fetchUsage,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Email Usage</h1>
          {data && <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{monthLabel(data.monthStart)}</p>}
        </div>
        {data && (
          <div className="flex items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white px-5 py-3 shadow-sm">
            <Mail className="h-4 w-4 text-[var(--color-brand-600)]" />
            <span className="text-sm text-[var(--color-text-secondary)]">Total sent</span>
            <span className="text-lg font-bold text-[var(--color-text-primary)]">{data.totalSent}</span>
          </div>
        )}
      </div>

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Company</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Plan</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)] w-64">Usage this month</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)]">
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-36" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-48" />
                    </td>
                  </tr>
                ))
              : data?.companies.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-subtle)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-text-primary)]">{c.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{c.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.plan === "ultimate" ? "success" : "default"}>{c.plan}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <UsageBar sent={c.sent} limit={c.limit} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



