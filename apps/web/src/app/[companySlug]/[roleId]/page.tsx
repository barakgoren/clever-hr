'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { MapPin, ArrowLeft, Briefcase } from 'lucide-react';
import { publicService } from '@/services/public.service';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { roleTypeLabel } from '@/lib/utils';
import type { FieldType } from '@repo/shared';

function FormField({
  id,
  label,
  type,
  required,
  placeholder,
  options,
}: {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}) {
  const inputClass =
    'w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  if (type === 'textarea') {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          name={id}
          required={required}
          placeholder={placeholder}
          rows={3}
          className={`${inputClass} resize-y`}
        />
      </div>
    );
  }

  if (type === 'checkbox') {
    return (
      <div className="flex items-center gap-2">
        <input type="checkbox" name={id} id={id} required={required} className="rounded" />
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select name={id} required={required} className={inputClass}>
          <option value="">Select…</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'file') {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="file"
          name={id}
          required={required}
          accept=".pdf,.doc,.docx"
          className="w-full text-sm text-slate-500 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-slate-200 cursor-pointer"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={id}
        required={required}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

export default function RoleDetailPage() {
  const { companySlug, roleId } = useParams<{ companySlug: string; roleId: string }>();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const { data: companyData } = useQuery({
    queryKey: ['public', 'company', companySlug],
    queryFn: () => publicService.getCompany(companySlug),
    retry: 1,
  });
  const company = companyData?.company;

  const { data: role, isLoading } = useQuery({
    queryKey: ['public', 'role', companySlug, roleId],
    queryFn: () => publicService.getRole(companySlug, Number(roleId)),
    retry: 1,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      await publicService.submitApplication(companySlug, Number(roleId), fd);
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex flex-col items-center py-10">
          <Skeleton className="h-20 w-20 rounded-full mb-3" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 gap-10 pb-16">
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-800">Position not found</p>
          <Link href={`/${companySlug}`} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            ← All jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Company header */}
      <div className="flex flex-col items-center py-10 border-b border-slate-200">
        {company?.logoUrl ? (
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
        {company && (
          <h2 className="mt-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
            {company.name}
          </h2>
        )}
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

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Application Submitted!</h2>
            <p className="text-sm text-slate-500 mt-2">
              Thank you for applying to {role.name} at {company?.name}. We'll be in touch soon.
            </p>
            <Link href={`/${companySlug}`}>
              <Button variant="secondary" size="sm" className="mt-6">
                View More Jobs
              </Button>
            </Link>
          </div>
        ) : (
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
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                {/* Always-present fields */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    placeholder="Enter your full name"
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Custom fields */}
                {role.customFields.map((field) => (
                  <FormField
                    key={field.id}
                    id={field.id}
                    label={field.label}
                    type={field.type}
                    required={field.required}
                    placeholder={field.placeholder}
                    options={field.options}
                  />
                ))}

                {error && (
                  <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
