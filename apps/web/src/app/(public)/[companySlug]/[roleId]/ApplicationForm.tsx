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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Application Submitted!</h2>
        <p className="text-sm text-slate-500 mt-2">
          Thank you for applying to {role.name} at {companyName}. We'll be in touch soon.
        </p>
        <Link href={`/${companySlug}`}>
          <Button variant="secondary" size="sm" className="mt-6">
            View More Jobs
          </Button>
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
  );
}
