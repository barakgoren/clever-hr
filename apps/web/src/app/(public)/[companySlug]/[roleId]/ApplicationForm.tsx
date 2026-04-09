'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { publicService } from '@/services/public.service';
import { Button } from '@/components/ui/button';
import type { FieldType, Role } from '@repo/shared';

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
  const baseInput =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-colors';

  if (type === 'textarea') {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          {label}{required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <textarea
          name={id}
          required={required}
          placeholder={placeholder}
          rows={3}
          className={`${baseInput} resize-y`}
        />
      </div>
    );
  }

  if (type === 'checkbox') {
    return (
      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          name={id}
          id={id}
          required={required}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor={id} className="text-sm text-slate-700">
          {label}{required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          {label}{required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <select name={id} required={required} className={baseInput}>
          <option value="">Select…</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'file') {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
          {label}{required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <div className="relative rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer">
          <input
            type="file"
            name={id}
            required={required}
            accept=".pdf,.doc,.docx"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <p className="text-sm text-slate-500">
            Click to upload <span className="text-indigo-600 font-medium">PDF, DOC, DOCX</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={id}
        required={required}
        placeholder={placeholder}
        className={baseInput}
      />
    </div>
  );
}

export function ApplicationForm({
  role,
  companySlug,
  companyName,
}: {
  role: Role;
  companySlug: string;
  companyName: string | undefined;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      await publicService.submitApplication(companySlug, Number(role.id), fd);
      setSubmitted(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
      const apiMessage = axiosErr?.response?.data?.error;
      if (apiMessage) {
        setError(apiMessage);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-slate-800">Application Submitted!</h2>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          Thanks for applying to <strong>{role.name}</strong> at {companyName}. We'll be in touch.
        </p>
        <Link href={`/${companySlug}`}>
          <button className="mt-5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            ← View more jobs
          </button>
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
        <p className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  );
}
