"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FileText,
  TrendingUp,
  Clock,
  Users,
  ArrowRight,
  Download,
} from "lucide-react";
import { applicationService } from "@/services/application.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import type { ApplicationWithRelations } from "@repo/shared";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getMonthKey(date: string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function buildMonthlyData(applications: ApplicationWithRelations[]) {
  const now = new Date();
  const months: { month: string; inProgress: number; pending: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const inMonth = applications.filter(
      (a) => getMonthKey(a.createdAt) === key,
    );
    months.push({
      month: MONTHS[d.getMonth()],
      inProgress: inMonth.length,
      pending: inMonth.filter((a) => a.currentStage?.name === "Pending").length,
    });
  }
  return months;
}

function buildTrendData(applications: ApplicationWithRelations[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const count = applications.filter(
      (a) => getMonthKey(a.createdAt) === key,
    ).length;
    return { month: MONTHS[d.getMonth()], count };
  });
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: number | string;
  sub: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              {title}
            </p>
            <p className="mt-1.5 text-3xl font-bold text-[var(--color-text-primary)]">
              {value}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{sub}</p>
          </div>
          <div className={`rounded-lg p-2 ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => applicationService.list(),
  });

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newThisWeek = applications.filter(
      (a) => new Date(a.createdAt) >= weekAgo,
    ).length;
    const pendingReview = applications.filter(
      (a) => a.currentStageId === null,
    ).length;
    const prevMonthCount = applications.filter((a) => {
      const d = new Date(a.createdAt);
      return (
        d < monthAgo && d >= new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      );
    }).length;

    return {
      total: applications.length,
      newThisWeek,
      pendingReview,
      prevMonthCount,
    };
  }, [applications]);

  const monthlyData = useMemo(
    () => buildMonthlyData(applications),
    [applications],
  );
  const trendData = useMemo(() => buildTrendData(applications), [applications]);
  const recentApplications = applications.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-5">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-5">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            Last 30 days
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.open(applicationService.exportUrl(), "_blank");
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Applications"
          value={stats.total.toLocaleString()}
          sub={
            stats.prevMonthCount > 0
              ? `+${Math.round((stats.total / Math.max(stats.prevMonthCount, 1) - 1) * 100)}% from last month`
              : "All time"
          }
          icon={FileText}
          iconColor="bg-blue-50 text-blue-500"
        />
        <StatCard
          title="New This Week"
          value={stats.newThisWeek}
          sub="+8% from last week"
          icon={TrendingUp}
          iconColor="bg-green-50 text-green-500"
        />
        <StatCard
          title="Pending Review"
          value={stats.pendingReview}
          sub="Requires attention"
          icon={Clock}
          iconColor="bg-amber-50 text-amber-500"
        />
        <StatCard
          title="Total Candidates"
          value={stats.total}
          sub="+5% from last month"
          icon={Users}
          iconColor="bg-purple-50 text-purple-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Applications Overview</CardTitle>
            <p className="text-xs text-[var(--color-text-muted)]">
              Monthly applications vs. interviews
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar
                  dataKey="pending"
                  fill="#fbbf24"
                  radius={[3, 3, 0, 0]}
                  name="Pending"
                />
                <Bar
                  dataKey="inProgress"
                  fill="#11a6e5"
                  radius={[3, 3, 0, 0]}
                  name="In Progress"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Trend</CardTitle>
            <p className="text-xs text-[var(--color-text-muted)]">
              Applications received over time
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#4f46e5", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  name="Applications"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Recent Applications</CardTitle>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Latest applications submitted to your company
            </p>
          </div>
          <Link href="/dashboard/applications">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-[var(--color-brand-600)]"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {recentApplications.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-[var(--color-text-muted)]">
              No applications yet.
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {recentApplications.map((app) => {
                const fullName = String(app.formData?.full_name ?? "—");
                const sub = app.role.name;
                return (
                  <Link
                    key={app.id}
                    href={`/dashboard/applications/${app.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-surface-subtle)] transition-colors"
                  >
                    <Avatar name={fullName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {fullName}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {sub}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {formatDate(app.createdAt)}
                      </span>
                      {app.currentStage ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${app.currentStage.color}1A`,
                            color: app.currentStage.color,
                          }}
                        >
                          {app.currentStage.name}
                        </span>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
