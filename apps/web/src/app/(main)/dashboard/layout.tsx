'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Skeleton } from '@/components/ui/skeleton';
import { companyService } from '@/services/company.service';

const PATH_TITLES: Array<[RegExp, string]> = [
  [/^\/dashboard\/applications\/\d+$/, ''],          // handled by application detail page
  [/^\/dashboard\/templates\/new$/, 'New Template'],
  [/^\/dashboard\/templates\/\d+\/edit$/, 'Edit Template'],
  [/^\/dashboard\/templates$/, 'Templates'],
  [/^\/dashboard\/email-templates$/, 'Email Templates'],
  [/^\/dashboard\/users$/, 'Users'],
  [/^\/dashboard\/usage$/, 'Usage'],
  [/^\/dashboard\/settings$/, 'Settings'],
  [/^\/dashboard\/applications$/, 'Applications'],
  [/^\/dashboard$/, 'Dashboard'],
];

function pageNameForPath(pathname: string): string {
  for (const [re, name] of PATH_TITLES) {
    if (re.test(pathname)) return name;
  }
  return 'Dashboard';
}

function DynamicFavicon() {
  const { data: company } = useQuery({ queryKey: ['company'], queryFn: companyService.get });
  useEffect(() => {
    if (!company?.logoUrl) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = company.logoUrl;
  }, [company?.logoUrl]);
  return null;
}

function DynamicTitle() {
  const pathname = usePathname();
  const { data: company } = useQuery({ queryKey: ['company'], queryFn: companyService.get });
  useEffect(() => {
    const pageName = pageNameForPath(pathname);
    if (!pageName) return; // application detail page manages its own title
    const companyName = company?.name ?? 'Clever HR';
    document.title = `${pageName} | ${companyName}`;
  }, [pathname, company?.name]);
  return null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-surface-subtle)]">
        <div className="space-y-3 w-64">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-subtle)]">
      <DynamicFavicon />
      <DynamicTitle />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden pl-[220px]">
        <TopBar />
        <main className="relative flex-1 min-h-0 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
