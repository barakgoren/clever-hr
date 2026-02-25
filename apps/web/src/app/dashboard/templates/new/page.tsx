'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RoleForm } from '../_components/RoleForm';

export default function NewTemplatePage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/templates"
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">New Template</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Fill in the template details below</p>
        </div>
      </div>

      <RoleForm />
    </div>
  );
}
