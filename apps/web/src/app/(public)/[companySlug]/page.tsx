import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Briefcase, ArrowRight, Clock } from "lucide-react";
import { serverFetch } from "@/lib/serverFetch";
import { roleTypeLabel } from "@/lib/utils";
import type { Role } from "@repo/shared";

interface CompanyPublicData {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
}

interface CompanyPageData {
  company: CompanyPublicData;
  roles: Role[];
}

export async function generateMetadata({ params }: { params: Promise<{ companySlug: string }> }): Promise<Metadata> {
  const { companySlug } = await params;
  try {
    const { company } = await serverFetch<CompanyPageData>(`/api/public/${companySlug}`);
    return {
      title: `Jobs at ${company.name}`,
      description: company.description ?? `Open positions at ${company.name}`,
      icons: company.logoUrl ? { icon: company.logoUrl } : undefined,
      openGraph: { images: company.logoUrl ? [company.logoUrl] : [] },
    };
  } catch {
    return { title: "Company Jobs" };
  }
}

export default async function CompanyJobBoardPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params;

  let data: CompanyPageData;
  try {
    data = await serverFetch<CompanyPageData>(`/api/public/${companySlug}`);
  } catch {
    notFound();
  }

  const { company, roles } = data;
  const activeRoles = roles.filter((r) => r.isActive);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero banner */}
      <div className="relative">
        {company.heroImageUrl ? <div className="h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url(${company.heroImageUrl})` }} /> : <div className="h-32 w-full bg-gradient-to-r from-indigo-600 to-indigo-500" />}

        {/* Company logo overlapping the banner */}
        <div className="max-w-2xl mx-auto px-4 relative">
          <div className="absolute bottom-0 translate-y-1/2">
            <div className="h-20 w-20 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-indigo-50">
                  <Briefcase className="h-8 w-8 text-indigo-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="pt-14 pb-6">
          <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
          {company.description && <p className="mt-2 text-sm text-slate-500 max-w-md leading-relaxed">{company.description}</p>}
        </div>
      </div>

      {/* Jobs section */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Open Positions
            {activeRoles.length > 0 && <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{activeRoles.length}</span>}
          </h2>
        </div>

        {activeRoles.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No open positions right now</p>
            <p className="text-xs text-slate-400 mt-1">Check back soon for new opportunities</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeRoles.map((role) => (
              <Link key={role.id} href={`/${companySlug}/${role.id}`} className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all duration-150">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{role.name}</p>
                  <div className="mt-1 flex items-center gap-3 flex-wrap">
                    {role.location && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {role.location}
                      </span>
                    )}
                    {role.seniorityLevel && <span className="text-xs text-slate-500">{role.seniorityLevel}</span>}
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{roleTypeLabel(role.type)}</span>
                  </div>
                  {role.description && <p className="mt-2 text-xs text-slate-500 line-clamp-1 leading-relaxed">{role.description}</p>}
                </div>
                <div className="shrink-0 ml-4 flex items-center gap-2 text-indigo-600">
                  <span className="text-xs font-medium hidden group-hover:inline">Apply</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-slate-400">
          Powered by <span className="font-medium">Claver HR</span>
        </p>
      </div>
    </div>
  );
}
