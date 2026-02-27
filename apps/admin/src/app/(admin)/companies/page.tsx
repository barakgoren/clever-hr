'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { companiesService } from '@/services/companies.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

export default function CompaniesPage() {
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesService.list,
  });

  const handleDeleteClick = (id: number, name: string) => {
    setConfirmId(id);
    setConfirmName(name);
  };

  const handleConfirmDelete = async () => {
    if (confirmId === null) return;
    setDeleting(true);
    try {
      await companiesService.delete(confirmId);
      qc.invalidateQueries({ queryKey: ['companies'] });
      setConfirmId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Companies</h1>
        <Link href="/companies/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Company
          </Button>
        </Link>
      </div>

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Slug</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Plan</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Users</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)]">
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              : companies?.map((c: any) => (
                  <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-subtle)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{c.name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{c.slug}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.plan === 'ultimate' ? 'success' : 'default'}>
                        {c.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{c._count?.users ?? 0}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/companies/${c.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        <Button
                          variant="danger-ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(c.id, c.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <Dialog open={confirmId !== null} onOpenChange={(open) => { if (!open) setConfirmId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete company</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Are you sure you want to delete <span className="font-semibold text-[var(--color-text-primary)]">{confirmName}</span>? This will permanently remove all users, roles, applications, and emails associated with this company.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
