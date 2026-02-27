'use client';

import { useState, FormEvent, use } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { companiesService } from '@/services/companies.service';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { PLAN_LIMITS } from '@repo/shared';
import { Trash2, Plus } from 'lucide-react';

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const companyId = parseInt(id);
  const qc = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companiesService.get(companyId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!company) return <p>Company not found.</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{company.name}</h1>
        <Badge variant={company.plan === 'ultimate' ? 'success' : 'default'}>{company.plan}</Badge>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <DetailsTab company={company} companyId={companyId} onSave={() => qc.invalidateQueries({ queryKey: ['company', companyId] })} />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab companyId={companyId} />
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionTab company={company} companyId={companyId} onSave={() => qc.invalidateQueries({ queryKey: ['company', companyId] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailsTab({ company, companyId, onSave }: { company: any; companyId: number; onSave: () => void }) {
  const [name, setName] = useState(company.name);
  const [slug, setSlug] = useState(company.slug);
  const [description, setDescription] = useState(company.description ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await companiesService.update(companyId, { name, slug, description: description || undefined });
      setSuccess(true);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
      <Input id="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input id="slug" label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
      <Input id="desc" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      {success && <p className="text-sm text-[var(--color-success)]">Saved successfully.</p>}
      <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
    </form>
  );
}

function UsersTab({ companyId }: { companyId: number }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['company-users', companyId],
    queryFn: () => companiesService.getUsers(companyId),
  });

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await companiesService.createUser(companyId, form);
      setOpen(false);
      setForm({ name: '', username: '', email: '', password: '', role: 'user' });
      qc.invalidateQueries({ queryKey: ['company-users', companyId] });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Delete this user?')) return;
    await companiesService.deleteUser(companyId, userId);
    qc.invalidateQueries({ queryKey: ['company-users', companyId] });
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Username</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)]">
                    {[1, 2, 3, 4, 5, 6].map((j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>)}
                  </tr>
                ))
              : users?.map((u: any) => (
                  <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-subtle)]">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">@{u.username}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'admin' ? 'default' : 'neutral'}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="danger-ghost" size="icon" onClick={() => handleDelete(u.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input id="uname" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input id="uusername" label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            <Input id="uemail" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input id="upassword" label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">Role</label>
              <select
                className="h-9 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-primary)]"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add User'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubscriptionTab({ company, companyId, onSave }: { company: any; companyId: number; onSave: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePlanChange = async (plan: 'team' | 'ultimate') => {
    setLoading(plan);
    try {
      await companiesService.updatePlan(companyId, plan);
      onSave();
    } finally {
      setLoading(null);
    }
  };

  const plans: Array<{ key: 'team' | 'ultimate'; label: string }> = [
    { key: 'team', label: 'Team' },
    { key: 'ultimate', label: 'Ultimate' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {plans.map(({ key, label }) => {
        const limits = PLAN_LIMITS[key];
        const isActive = company.plan === key;
        return (
          <div
            key={key}
            className={`rounded-[var(--radius-xl)] border-2 p-6 transition-colors ${
              isActive
                ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)]'
                : 'border-[var(--color-border)] bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[var(--color-text-primary)]">{label}</h3>
              {isActive && <Badge>Current</Badge>}
            </div>
            <ul className="space-y-1 text-sm text-[var(--color-text-secondary)] mb-4">
              <li>Emails/month: {limits.emailsPerMonth ?? 'Unlimited'}</li>
              <li>Stages/role: {limits.stagesPerRole ?? 'Unlimited'}</li>
              <li>Active roles: {limits.activeRoles ?? 'Unlimited'}</li>
            </ul>
            <Button
              variant={isActive ? 'secondary' : 'primary'}
              size="sm"
              disabled={isActive || loading !== null}
              onClick={() => handlePlanChange(key)}
            >
              {loading === key ? 'Updating…' : isActive ? 'Active' : `Switch to ${label}`}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
