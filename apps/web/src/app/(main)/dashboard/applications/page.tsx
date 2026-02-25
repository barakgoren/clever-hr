'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Eye, Trash2, Download, Search } from 'lucide-react';
import { applicationService } from '@/services/application.service';
import { roleService } from '@/services/role.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationService.list(),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: roleService.list,
  });

  const deleteMutation = useMutation({
    mutationFn: applicationService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  });

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const fullName = String(app.formData?.full_name ?? '').toLowerCase();
      const email = String(app.formData?.email ?? '').toLowerCase();
      const phone = String(app.formData?.phone ?? '').toLowerCase();
      const matchesSearch =
        !search ||
        fullName.includes(search.toLowerCase()) ||
        email.includes(search.toLowerCase()) ||
        phone.includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || String(app.roleId) === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [applications, search, roleFilter]);

  return (
    <div className="space-y-5">
      {/* Top actions */}
      <div className="flex items-center justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open(applicationService.exportUrl(), '_blank')}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      <Card>
        {/* Table header */}
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              All Applications
            </h2>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {filtered.length} {filtered.length === 1 ? 'application' : 'applications'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--color-border)]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-white pl-9 pr-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">No applications found</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {search || roleFilter !== 'all' ? 'Try adjusting your filters' : 'Applications will appear here once submitted'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Full name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Application Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Applied Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map((app) => {
                const fullName = String(app.formData?.full_name ?? '—');
                return (
                  <tr key={app.id} className="hover:bg-[var(--color-surface-subtle)] transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">{app.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--color-text-primary)]">
                      {fullName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ backgroundColor: `${app.role.color}1A`, color: app.role.color }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: app.role.color }} />
                        {app.role.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {app.currentStage ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                          style={{ backgroundColor: `${app.currentStage.color}1A`, color: app.currentStage.color }}
                        >
                          {app.currentStage.name}
                        </span>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/applications/${app.id}`}>
                          <Button variant="ghost" size="icon" title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          className="text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]"
                          onClick={() => {
                            if (confirm('Delete this application?')) {
                              deleteMutation.mutate(app.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
