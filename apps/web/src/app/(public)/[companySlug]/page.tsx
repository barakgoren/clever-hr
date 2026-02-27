"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MapPin, Briefcase, ArrowRight } from "lucide-react";
import { publicService } from "@/services/public.service";
import { Skeleton } from "@/components/ui/skeleton";
import { roleTypeLabel } from "@/lib/utils";

export default function CompanyJobBoardPage() {
  const { companySlug } = useParams<{ companySlug: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public", "company", companySlug],
    queryFn: () => publicService.getCompany(companySlug),
    retry: 1,
  });
  const company = data?.company;
  const roles = data?.roles ?? [];
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex flex-col items-center py-12">
          <Skeleton className="h-20 w-20 rounded-full mb-4" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="max-w-2xl mx-auto px-4 space-y-4 pb-16">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-800">Company not found</p>
          <p className="text-sm text-slate-500 mt-1">The company you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const activeRoles = roles.filter((r) => r.isActive);

  return (
    <div className="min-h-screen max-w-4xl mx-auto">
      {/* Hero / Header */}
      {company.heroImageUrl && <div className="h-40 w-full bg-cover bg-center" style={{ backgroundImage: `url(${company.heroImageUrl})` }} />}

      {/* Company identity */}
      <div className="w-32 h-32 -mt-16 ms-8 bg-background bg-(--color-surface-subtle) p-2 rounded-xl">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt={company.name} className="h-full w-full rounded-xl object-cover shadow-md" />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-100">
            <Briefcase className="h-8 w-8 text-slate-400" />
          </div>
        )}
      </div>

      {/* Jobs list */}
      <div className="mx-auto px-10 py-10 pb-20">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-6">Current Openings</h2>

        {activeRoles.length === 0 ? (
          <p className="text-sm text-slate-500">No open positions at this time.</p>
        ) : (
          <div className="divide-y divide-slate-200">
            {activeRoles.map((role) => (
              <div key={role.id} className="py-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link href={`/${companySlug}/${role.id}`} className="text-base font-semibold text-blue-600 hover:underline">
                    {role.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    {role.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {role.location}
                      </span>
                    )}
                    {role.seniorityLevel && <span>{role.seniorityLevel}</span>}
                    <span>{roleTypeLabel(role.type)}</span>
                  </div>
                  {role.description && <p className="mt-2 text-sm text-slate-600 line-clamp-2 leading-relaxed">{role.description}</p>}
                </div>
                <Link href={`/${companySlug}/${role.id}`} className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 whitespace-nowrap">
                  Apply <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
