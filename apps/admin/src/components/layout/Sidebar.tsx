'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, ShieldCheck, Shield, LogOut, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/avatar';

const NAV = [
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/usage', label: 'Usage', icon: BarChart2 },
  { href: '/superadmins', label: 'Superadmins', icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 flex w-[220px] flex-col border-r border-[var(--color-border)] z-30 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)]">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-[var(--color-border)] bg-white px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0">
          <Shield className="h-4 w-4 text-[var(--color-brand-600)]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
            Clever HR Admin
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] truncate">
            Superadmin Panel
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          Navigation
        </p>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors border border-transparent',
                active
                  ? 'bg-[var(--color-sidebar-active)] text-[var(--color-brand-700)] border-[var(--color-brand-100)] shadow-sm'
                  : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-brand-700)]',
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
        <div className="border-t border-[var(--color-border)] bg-white/70 backdrop-blur-sm p-3">
          <div className="flex items-center gap-3 rounded-[var(--radius)] px-2 py-2">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {user.name}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] truncate">@{user.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-brand-700)] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
