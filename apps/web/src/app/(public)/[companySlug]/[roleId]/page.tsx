import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ArrowLeft, Briefcase } from 'lucide-react';
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
    <div className="min-h-screen bg-white">
      {/* Company header */}
      <div className="flex flex-col items-center py-10 border-b border-slate-200">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={company.name}
            className="h-20 w-20 rounded-full object-cover shadow-md"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
            <Briefcase className="h-8 w-8 text-slate-400" />
          </div>
        )}
        <h2 className="mt-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
          {company.name}
        </h2>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10 pb-20">
        <Link
          href={`/${companySlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Jobs
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_400px]">
          {/* Left: Job details */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{role.name}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-slate-500 flex-wrap">
              {role.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {role.location}
                </span>
              )}
              {role.seniorityLevel && <span>{role.seniorityLevel}</span>}
              <span>{roleTypeLabel(role.type)}</span>
            </div>

            {role.description && (
              <>
                <h2 className="mt-8 text-base font-semibold text-slate-800">Description</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {role.description}
                </p>
              </>
            )}

            {role.requirements.length > 0 && (
              <>
                <h2 className="mt-8 text-base font-semibold text-slate-800">Requirements</h2>
                <ul className="mt-2 space-y-1.5">
                  {role.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Right: Application form */}
          <div>
            <ApplicationForm
              role={role}
              companySlug={companySlug}
              companyName={company.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
