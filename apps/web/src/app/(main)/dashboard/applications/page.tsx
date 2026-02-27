'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Eye, Trash2, Download, Search } from 'lucide-react';
import { applicationService } from '@/services/application.service';
import { roleService } from '@/services/role.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BulkActionBar, type BulkAction } from '@/components/BulkActionBar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import type { ApplicationWithRelations } from '@repo/shared';

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

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

  const deleteManyMutation = useMutation({
    mutationFn: applicationService.deleteMany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setSelectedIds(new Set());
    },
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

  // Keep selection clean: remove IDs that are no longer in the filtered set
  useEffect(() => {
    const filteredIds = new Set(filtered.map((a) => a.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => filteredIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  // Sync indeterminate state of header checkbox
  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));
  const someSelected = filtered.some((a) => selectedIds.has(a.id));

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (!el) return;
    el.indeterminate = someSelected && !allFilteredSelected;
  }, [someSelected, allFilteredSelected]);

  function toggleAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.add(a.id));
        return next;
      });
    }
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const bulkActions: BulkAction<ApplicationWithRelations>[] = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-3.5 w-3.5" />,
      variant: 'danger',
      confirm: `Delete ${selectedIds.size} application${selectedIds.size === 1 ? '' : 's'}? This cannot be undone.`,
      onAction: (items) => deleteManyMutation.mutateAsync(items.map((i) => i.id)),
      isPending: deleteManyMutation.isPending,
    },
  ];

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
              {search || roleFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Applications will appear here once submitted'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="w-10 px-4 py-3">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    className="rounded cursor-pointer"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                  />
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
                const isSelected = selectedIds.has(app.id);
                return (
                  <tr
                    key={app.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-[var(--color-brand-50,#eff6ff)]'
                        : 'hover:bg-[var(--color-surface-subtle)]'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded cursor-pointer"
                        checked={isSelected}
                        onChange={() => toggleOne(app.id)}
                      />
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
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: app.role.color }}
                        />
                        {app.role.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
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

      <BulkActionBar
        selectedIds={selectedIds}
        allItems={applications}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
