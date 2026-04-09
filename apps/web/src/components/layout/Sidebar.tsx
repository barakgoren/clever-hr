"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Layers,
  Users,
  Settings,
  LogOut,
  Briefcase,
  Mail,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/company.service";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/applications", label: "Applications", icon: FileText },
  { href: "/dashboard/templates", label: "Templates", icon: Layers },
  { href: "/dashboard/users", label: "Users", icon: Users },
  { href: "/dashboard/email-templates", label: "Email Templates", icon: Mail },
  { href: "/dashboard/usage", label: "Usage", icon: BarChart2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: company } = useQuery({
    queryKey: ["company"],
    queryFn: companyService.get,
    enabled: !!user,
  });

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside
      className="fixed inset-y-0 left-0 flex w-[220px] flex-col z-30"
      style={{ background: "var(--color-sidebar-bg)" }}
    >
      {/* Brand */}
      <div
        className="flex h-14 items-center gap-2.5 px-5"
        style={{ borderBottom: "1px solid var(--color-sidebar-border)" }}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-brand-600)] shrink-0">
          {company?.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="h-5 w-5 rounded object-cover"
            />
          ) : (
            <Briefcase className="h-3.5 w-3.5 text-white" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-none">
            Claver<span className="text-[var(--color-brand-500)]">HR</span>
          </p>
          <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--color-sidebar-text)" }}>
            {company?.name ?? "…"}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-all duration-150",
                active
                  ? "text-white"
                  : "hover:text-white"
              )}
              style={
                active
                  ? { background: "var(--color-sidebar-active)", color: "white" }
                  : { color: "var(--color-sidebar-text)" }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-sidebar-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <Icon className="h-4 w-4 shrink-0" style={{ opacity: active ? 1 : 0.7 }} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div className="p-3" style={{ borderTop: "1px solid var(--color-sidebar-border)" }}>
          <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
            <Avatar name={user.name || user.email} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate leading-none">
                {user.name || "User"}
              </p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--color-sidebar-text)" }}>
                {user.email}
              </p>
            </div>
            {user.role === "admin" && (
              <span className="shrink-0 rounded-full bg-[var(--color-brand-900)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-brand-200)]">
                Admin
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-[var(--radius)] px-3 py-2 text-sm transition-all duration-150"
            style={{ color: "var(--color-sidebar-text)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--color-sidebar-hover)";
              (e.currentTarget as HTMLElement).style.color = "white";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--color-sidebar-text)";
            }}
          >
            <LogOut className="h-4 w-4 opacity-70" />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
