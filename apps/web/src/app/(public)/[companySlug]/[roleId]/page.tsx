import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ArrowLeft, Briefcase, Clock, Building2 } from 'lucide-react';
import { serverFetch } from '@/lib/serverFetch';
import { roleTypeLabel } from '@/lib/utils';
import { ApplicationForm } from './ApplicationForm';
import type { Role } from '@repo/shared';

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string; roleId: string }>;
}): Promise<Metadata> {
  const { companySlug, roleId } = await params;
  try {
    const [{ company }, role] = await Promise.all([
      serverFetch<CompanyPageData>(`/api/public/${companySlug}`),
      serverFetch<Role>(`/api/public/${companySlug}/roles/${roleId}`),
    ]);
    return {
      title: `${role.name} at ${company.name}`,
      description: role.description ?? `Apply for ${role.name} at ${company.name}`,
      icons: company.logoUrl ? { icon: company.logoUrl } : undefined,
      openGraph: { images: company.logoUrl ? [company.logoUrl] : [] },
    };
  } catch {
    return { title: 'Job Opening' };
  }
}

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ companySlug: string; roleId: string }>;
}) {
  const { companySlug, roleId } = await params;

  let company: CompanyPublicData;
  let role: Role;
  try {
    const [companyData, roleData] = await Promise.all([
      serverFetch<CompanyPageData>(`/api/public/${companySlug}`),
      serverFetch<Role>(`/api/public/${companySlug}/roles/${roleId}`),
    ]);
    company = companyData.company;
    role = roleData;
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Minimal top nav */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/${companySlug}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Jobs
          </Link>
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="h-7 w-7 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <span className="text-sm font-semibold text-slate-700">{company.name}</span>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 pb-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left: Job details */}
          <div className="space-y-6">
            {/* Job title card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
                  ) : (
                    <Briefcase className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                    <Building2 className="h-3 w-3" />
                    {company.name}
                  </p>
                  <h1 className="text-xl font-bold text-slate-900">{role.name}</h1>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {role.location && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {role.location}
                      </span>
                    )}
                    {role.seniorityLevel && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                        {role.seniorityLevel}
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700 font-medium">
                      {roleTypeLabel(role.type)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {role.description && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800 mb-3">About this role</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {role.description}
                </p>
              </div>
            )}

            {/* Requirements */}
            {role.requirements.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800 mb-3">Requirements</h2>
                <ul className="space-y-2">
                  {role.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: Application form */}
          <div className="lg:sticky lg:top-20 self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-1">Apply for this role</h2>
              <p className="text-xs text-slate-500 mb-5">
                Fill in the form below and we'll get back to you.
              </p>
              <ApplicationForm
                role={role}
                companySlug={companySlug}
                companyName={company.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
