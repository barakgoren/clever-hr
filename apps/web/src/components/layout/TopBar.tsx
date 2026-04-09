'use client';

import { usePathname } from 'next/navigation';
import { PanelLeft, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/dashboard':                    { title: 'Dashboard',       description: "Here's what's happening with your applications." },
  '/dashboard/applications':       { title: 'Applications',    description: 'Manage and review all job applications' },
  '/dashboard/templates':          { title: 'Templates',       description: 'Create and manage job role templates' },
  '/dashboard/users':              { title: 'Users',           description: 'Manage company users and their permissions' },
  '/dashboard/email-templates':    { title: 'Email Templates', description: 'Manage email templates for candidate communication' },
  '/dashboard/usage':              { title: 'Usage',           description: 'Monitor your plan usage and limits' },
  '/dashboard/settings':           { title: 'Settings',        description: 'Manage your company and application settings' },
};

interface TopBarProps {
  onSearchOpen?: () => void;
}

export function TopBar({ onSearchOpen }: TopBarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: companyService.get,
    enabled: !!user,
  });

  // Match the most specific path
  const meta =
    Object.entries(PAGE_META)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([p]) => pathname === p || pathname.startsWith(p + '/'))?.[1] ??
    PAGE_META['/dashboard'];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white px-6 z-10">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)] leading-none tracking-tight">
          {meta.title}
        </h1>
        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{meta.description}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSearchOpen}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
        <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-text-muted)]">
          <span className="text-xs">⌘</span>K
        </kbd>
        {company?.logoUrl && (
          <img
            src={company.logoUrl}
            alt={company.name}
            className="h-7 w-7 rounded-full object-cover border border-[var(--color-border)]"
          />
        )}
      </div>
    </header>
  );
}
