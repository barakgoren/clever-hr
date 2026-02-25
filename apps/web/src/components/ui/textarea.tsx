import { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, id, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          'w-full resize-y rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-sm placeholder:text-[var(--color-text-muted)] transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
