'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center gap-1 border-b border-[var(--color-border)] w-full',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] border-b-2 border-transparent -mb-px transition-colors cursor-pointer',
        'hover:text-[var(--color-text-primary)]',
        'data-[state=active]:border-[var(--color-brand-600)] data-[state=active]:text-[var(--color-brand-600)]',
        'focus-visible:outline-none',
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: TabsPrimitive.TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={cn('mt-6 focus-visible:outline-none', className)}
      {...props}
    />
  );
}
