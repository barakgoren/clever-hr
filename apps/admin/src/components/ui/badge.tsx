import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:   'bg-[var(--color-brand-100)] text-[var(--color-brand-700)]',
        success:   'bg-[var(--color-success-bg)] text-[var(--color-success)]',
        warning:   'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
        danger:    'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
        neutral:   'bg-slate-100 text-slate-600',
        outline:   'border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
