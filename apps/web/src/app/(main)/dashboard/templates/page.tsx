'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Eye, Pencil, MapPin, Briefcase } from 'lucide-react';
import { roleService } from '@/services/role.service';
import { companyService } from '@/services/company.service';
import { usePlan } from '@/hooks/usePlan';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  hybrid: 'Hybrid',
  remote: 'Remote',
};

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const { isAtActiveRoleLimit } = usePlan();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: roleService.list,
  });

  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: companyService.get,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      roleService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['company-usage'] });
    },
  });

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-end mb-6">
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        {isAtActiveRoleLimit ? (
          <Button size="sm" disabled title="Active role limit reached for your plan">
            <Plus className="h-4 w-4" />
            Add Template
          </Button>
        ) : (
          <Link href="/dashboard/templates/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Template
            </Button>
          </Link>
        )}
      </div>

      {roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-xl bg-[var(--color-brand-50)] flex items-center justify-center mb-4">
            <Briefcase className="h-6 w-6 text-[var(--color-brand-600)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">No templates yet</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs">Create your first job template to start collecting applications.</p>
          {isAtActiveRoleLimit ? (
            <Button size="sm" className="mt-4" disabled title="Active role limit reached for your plan">
              <Plus className="h-4 w-4" />
              Add Template
            </Button>
          ) : (
            <Link href="/dashboard/templates/new">
              <Button size="sm" className="mt-4">
                <Plus className="h-4 w-4" />
                Add Template
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="group rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm flex flex-col overflow-hidden hover:shadow-md hover:border-[var(--color-border-strong)] transition-all duration-200"
            >
              {/* Color accent bar */}
              <div className="h-1 w-full shrink-0" style={{ backgroundColor: role.color }} />

              {/* Header */}
              <div className="p-5 pb-3 flex-1">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight truncate">
                      {role.name}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      role.isActive
                        ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${role.isActive ? 'bg-[var(--color-success)]' : 'bg-slate-400'}`} />
                    {role.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Meta tags */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {role.type && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-subtle)] px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)]">
                      <Briefcase className="h-3 w-3" />
                      {TYPE_LABELS[role.type] ?? role.type}
                    </span>
                  )}
                  {role.location && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-subtle)] px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)]">
                      <MapPin className="h-3 w-3" />
                      {role.location}
                    </span>
                  )}
                </div>

                {role.description && (
                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[var(--color-border)] px-5 py-3 flex items-center justify-between bg-[var(--color-surface-subtle)]">
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Updated {formatDate(role.updatedAt)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {role.isActive ? 'On' : 'Off'}
                  </span>
                  <Switch
                    checked={role.isActive}
                    disabled={!role.isActive && isAtActiveRoleLimit}
                    title={!role.isActive && isAtActiveRoleLimit ? 'Active role limit reached for your plan' : undefined}
                    onCheckedChange={(checked) => {
                      if (checked && isAtActiveRoleLimit) return;
                      toggleMutation.mutate({ id: role.id, isActive: checked });
                    }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 divide-x divide-[var(--color-border)] border-t border-[var(--color-border)]">
                <Link
                  href={company ? `/${company.slug}/${role.id}` : '#'}
                  className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Link>
                <Link
                  href={`/dashboard/templates/${role.id}/edit`}
                  className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
