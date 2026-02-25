'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Plus, Mail, Pencil, Trash2 } from 'lucide-react';
import { userService } from '@/services/user.service';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import type { User, UserRole } from '@repo/shared';

type UserFormState = {
  name: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
};

const emptyForm = (): UserFormState => ({
  name: '',
  email: '',
  username: '',
  password: '',
  role: 'user',
});

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm());
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userService.list,
  });

  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setForm(emptyForm());
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof userService.update>[1] }) =>
      userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, username: u.username, password: '', role: u.role });
    setDialogOpen(true);
    setMenuOpen(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const patch: Parameters<typeof userService.update>[1] = {
        name: form.name,
        email: form.email,
        role: form.role,
      };
      if (form.password) patch.password = form.password;
      updateMutation.mutate({ id: editing.id, data: patch });
    } else {
      createMutation.mutate({
        name: form.name,
        email: form.email,
        username: form.username,
        password: form.password,
        role: form.role,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        {currentUser?.role === 'admin' && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-sm text-[var(--color-text-muted)]">No users yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm p-5 relative"
            >
              {/* Three-dot menu */}
              {currentUser?.role === 'admin' && u.id !== currentUser?.id && (
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                    className="p-1 rounded hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menuOpen === u.id && (
                    <div className="absolute right-0 top-7 z-20 min-w-[140px] rounded-[var(--radius)] border border-[var(--color-border)] bg-white shadow-lg py-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)] transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${u.name}?`)) {
                            deleteMutation.mutate(u.id);
                          }
                          setMenuOpen(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* User info */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={u.name || u.email} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{u.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{u.email}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-muted)]">Role</span>
                  <Badge variant={u.role === 'admin' ? 'default' : 'neutral'}>{u.role}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-muted)]">Username</span>
                  <span className="text-xs font-mono text-[var(--color-text-primary)]">{u.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs flex items-center gap-1 text-[var(--color-text-muted)]">
                    Joined
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">{formatDate(u.createdAt)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <a href={`mailto:${u.email}`}>
                  <button className="flex w-full items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] transition-colors">
                    <Mail className="h-3.5 w-3.5" />
                    Send Message
                  </button>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click-outside overlay for menu */}
      {menuOpen !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}

      {/* Add / Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              label="Full Name"
              placeholder="Jane Smith"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="jane@company.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              id="username"
              label="Username"
              placeholder="jane_smith"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
            />
            <Input
              id="password"
              label={editing ? 'Password (leave blank to keep)' : 'Password'}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required={!editing}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Role
              </label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v as UserRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(createMutation.isError || updateMutation.isError) && (
              <p className="text-sm text-[var(--color-danger)]">
                Failed to save. Please check the details and try again.
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
