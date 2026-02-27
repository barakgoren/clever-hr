'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Eye, Pencil } from 'lucide-react';
import { roleService } from '@/services/role.service';
import { companyService } from '@/services/company.service';
import { usePlan } from '@/hooks/usePlan';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

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
          <p className="text-sm font-medium text-[var(--color-text-primary)]">No templates yet</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Create your first job template to get started.</p>
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
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm flex flex-col overflow-hidden"
            >
              {/* Color accent bar */}
              <div className="h-1 w-full shrink-0" style={{ backgroundColor: role.color }} />
              <div className="flex items-start justify-between p-5 pb-3">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {role.name}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Created {formatDate(role.createdAt)}
                  </p>
                </div>
                <Badge variant={role.isActive ? 'success' : 'neutral'}>
                  {role.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {role.description && (
                <p className="px-5 text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                  {role.description}
                </p>
              )}

              <div className="flex items-center justify-between px-5 py-3 mt-auto">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Updated {formatDate(role.updatedAt)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-muted)]">Active</span>
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

              <div className="border-t border-[var(--color-border)] grid grid-cols-2 divide-x divide-[var(--color-border)]">
                <Link
                  href={company ? `/${company.slug}/${role.id}` : '#'}
                  className="flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)] transition-colors rounded-bl-[var(--radius-lg)]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Link>
                <Link
                  href={`/dashboard/templates/${role.id}/edit`}
                  className="flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)] transition-colors rounded-br-[var(--radius-lg)]"
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
