'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '@/lib/utils';

export const Command = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn('flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-xl)] bg-white', className)}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

export const CommandInput = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Input
    ref={ref}
    className={cn(
      'flex h-12 w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

export const CommandList = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-[360px] overflow-y-auto overflow-x-hidden', className)}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

export const CommandEmpty = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-10 text-center text-sm text-[var(--color-text-muted)]" {...props} />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

export const CommandGroup = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--color-text-muted)]',
      className
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

export const CommandItem = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none',
      'data-[selected=true]:bg-[var(--color-surface-subtle)] data-[selected=true]:text-[var(--color-text-primary)]',
      'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      className
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

export const CommandSeparator = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn('h-px bg-[var(--color-border)] mx-1 my-1', className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;
