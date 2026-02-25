'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Layers,
  Users,
  Settings,
  LogOut,
  Briefcase,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { useRouter } from 'next/navigation';

const NAV = [
  { href: '/dashboard',                      label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/dashboard/applications',         label: 'Applications',    icon: FileText },
  { href: '/dashboard/templates',            label: 'Templates',       icon: Layers },
  { href: '/dashboard/users',                label: 'Users',           icon: Users },
  { href: '/dashboard/email-templates',      label: 'Email Templates', icon: Mail },
  { href: '/dashboard/settings',             label: 'Settings',        icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: companyService.get,
    enabled: !!user,
  });

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 flex w-[220px] flex-col bg-[var(--color-sidebar-bg)] z-30">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-600)] shrink-0">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="h-6 w-6 rounded object-cover" />
          ) : (
            <Briefcase className="h-4 w-4 text-white" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">CV Manager</p>
          <p className="text-xs text-[var(--color-sidebar-text)] truncate">{company?.name ?? '...'}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Navigation
        </p>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-[var(--color-brand-600)] text-white'
                  : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-3 rounded-[var(--radius)] px-2 py-2">
            <Avatar name={user.name || user.email} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            {user.role === 'admin' && (
              <span className="shrink-0 rounded-full bg-[var(--color-brand-600)]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-brand-200)]">
                Admin
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm text-slate-400 hover:bg-[var(--color-sidebar-hover)] hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
