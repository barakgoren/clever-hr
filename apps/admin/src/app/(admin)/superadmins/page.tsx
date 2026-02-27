'use client';

import { useState, FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { superadminsService } from '@/services/superadmins.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default function SuperadminsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: admins, isLoading } = useQuery({
    queryKey: ['superadmins'],
    queryFn: superadminsService.list,
  });

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await superadminsService.create(form);
      setOpen(false);
      setForm({ name: '', username: '', password: '' });
      qc.invalidateQueries({ queryKey: ['superadmins'] });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to create superadmin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Superadmins</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Superadmin
        </Button>
      </div>

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Username</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)]">
                    {[1, 2, 3].map((j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>)}
                  </tr>
                ))
              : admins?.map((a: any) => (
                  <tr key={a.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-subtle)]">
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">@{a.username}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{formatDate(a.createdAt)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Superadmin</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input id="saname" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input id="sausername" label="Username" placeholder="lowercase, digits, underscores only" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            <Input id="sapassword" label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add Superadmin'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
