'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Bell, ShieldCheck, Database, RefreshCw, ImageIcon } from 'lucide-react';
import { companyService } from '@/services/company.service';
import { userService } from '@/services/user.service';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { Company } from '@repo/shared';

function ImageUploadBox({
  label,
  currentUrl,
  onUpload,
  loading,
}: {
  label: string;
  currentUrl?: string | null;
  onUpload: (file: File) => void;
  loading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden w-40 h-40 bg-[var(--color-surface-subtle)] relative flex items-center justify-center">
        {currentUrl ? (
          <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="h-10 w-10 text-slate-300" />
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        Replace image
      </button>
      <p className="text-[10px] text-[var(--color-text-muted)]">JPEG, PNG, WEBP, or GIF under 8MB.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
    </div>
  );
}

function CompanyTab({ company }: { company: Company }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(company.name);
  const [slug, setSlug] = useState(company.slug);
  const [description, setDescription] = useState(company.description ?? '');
  const [selectedAdminIds, setSelectedAdminIds] = useState<number[]>([]);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: userService.list,
  });

  useEffect(() => {
    if (users.length > 0) {
      setSelectedAdminIds(users.filter((u) => u.role === 'admin').map((u) => u.id));
    }
  }, [users]);

  const updateMutation = useMutation({
    mutationFn: () => companyService.update({ name, slug, description: description || null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company'] }),
  });

  const slugError =
    updateMutation.isError && (updateMutation.error as any)?.response?.data?.error?.toLowerCase().includes('slug')
      ? ((updateMutation.error as any)?.response?.data?.error as string)
      : null;

  const logoMutation = useMutation({
    mutationFn: (file: File) => companyService.uploadLogo(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company'] }),
  });

  const heroMutation = useMutation({
    mutationFn: (file: File) => companyService.uploadHero(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company'] }),
  });

  const toggleAdmin = (userId: number) => {
    setSelectedAdminIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Company Settings</h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Admins can update the company name, admins list, hero, and logo.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-8 items-start">
        {/* Left */}
        <div className="space-y-5">
          <Input
            id="company-name"
            label="Company name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            id="company-slug"
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            error={slugError ?? undefined}
            placeholder="my-company"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="company-description" className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Description
            </label>
            <textarea
              id="company-description"
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of your company…"
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-colors"
            />
            <p className="text-[10px] text-[var(--color-text-muted)] text-right">{description.length} / 500</p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] flex items-center gap-1">
              Admin users
              <span className="normal-case font-normal text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                IDs only
              </span>
            </label>
            <p className="text-xs text-[var(--color-text-muted)]">
              Select which users can administer the company.
            </p>
            <div className="rounded-[var(--radius)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
              {users.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[var(--color-surface-subtle)] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedAdminIds.includes(u.id)}
                    onChange={() => toggleAdmin(u.id)}
                    className="rounded border-[var(--color-border)] text-[var(--color-brand-600)] focus:ring-[var(--color-brand-500)]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{u.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{u.email}</p>
                  </div>
                </label>
              ))}
            </div>
            {selectedAdminIds.length > 0 && (
              <p className="text-xs text-[var(--color-text-muted)]">
                Selected user IDs: {selectedAdminIds.join(', ')}
              </p>
            )}
          </div>

          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            size="sm"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          {updateMutation.isSuccess && (
            <p className="text-xs text-[var(--color-success)]">Saved successfully.</p>
          )}
        </div>

        {/* Right */}
        <div className="flex flex-col gap-6">
          <ImageUploadBox
            label="Hero image"
            currentUrl={company.heroImageUrl}
            onUpload={(file) => heroMutation.mutate(file)}
            loading={heroMutation.isPending}
          />
          <ImageUploadBox
            label="Logo"
            currentUrl={company.logoUrl}
            onUpload={(file) => logoMutation.mutate(file)}
            loading={logoMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}

function StubTab({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{message}</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">This section is coming soon.</p>
    </div>
  );
}

export default function SettingsPage() {
  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: companyService.get,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!company) return null;

  return (
    <Tabs defaultValue="company">
      <TabsList>
        <TabsTrigger value="company">
          <Building2 className="h-3.5 w-3.5" />
          Company
        </TabsTrigger>
        <TabsTrigger value="alerts">
          <Bell className="h-3.5 w-3.5" />
          Alerts
        </TabsTrigger>
        <TabsTrigger value="security">
          <ShieldCheck className="h-3.5 w-3.5" />
          Security
        </TabsTrigger>
        <TabsTrigger value="data">
          <Database className="h-3.5 w-3.5" />
          Data
        </TabsTrigger>
      </TabsList>

      <TabsContent value="company">
        <CompanyTab company={company} />
      </TabsContent>

      <TabsContent value="alerts">
        <StubTab message="Alerts & Notifications" />
      </TabsContent>

      <TabsContent value="security">
        <StubTab message="Security Settings" />
      </TabsContent>

      <TabsContent value="data">
        <StubTab message="Data Management" />
      </TabsContent>
    </Tabs>
  );
}
