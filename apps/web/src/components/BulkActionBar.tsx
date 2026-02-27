'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface BulkActionAvailability {
  enabled: boolean;
  /** Shown as a tooltip on the disabled button so the user knows why. */
  reason?: string;
}

export interface BulkAction<T> {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** Defaults to 'secondary'. Use 'danger' for destructive actions. */
  variant?: 'default' | 'danger';
  /**
   * Optional gate: receives the currently-selected items and returns whether
   * this action is available. Use this for actions that require all selected
   * items to share a common attribute (e.g. same role for stage-change).
   * If omitted, the action is always available.
   */
  available?: (selectedItems: T[]) => BulkActionAvailability;
  /** If set, a native confirm dialog is shown before calling onAction. */
  confirm?: string;
  onAction: (selectedItems: T[]) => void | Promise<void>;
  isPending?: boolean;
}

interface BulkActionBarProps<T extends { id: number }> {
  selectedIds: Set<number>;
  allItems: T[];
  actions: BulkAction<T>[];
  onClearSelection: () => void;
}

export function BulkActionBar<T extends { id: number }>({
  selectedIds,
  allItems,
  actions,
  onClearSelection,
}: BulkActionBarProps<T>) {
  const count = selectedIds.size;
  const visible = count > 0;
  const selectedItems = allItems.filter((item) => selectedIds.has(item.id));

  async function handleAction(action: BulkAction<T>) {
    if (action.confirm && !window.confirm(action.confirm)) return;
    await action.onAction(selectedItems);
  }

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 shadow-xl shadow-black/10 whitespace-nowrap">
        {/* Count */}
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          {count} {count === 1 ? 'item' : 'items'} selected
        </span>

        <div className="h-4 w-px bg-[var(--color-border)]" />

        {/* Actions */}
        {actions.map((action) => {
          const availability = action.available
            ? action.available(selectedItems)
            : { enabled: true };
          const isDisabled = !availability.enabled || action.isPending;

          return (
            <Button
              key={action.id}
              variant={action.variant === 'danger' ? 'danger' : 'secondary'}
              size="sm"
              disabled={isDisabled}
              title={!availability.enabled ? availability.reason : undefined}
              onClick={() => handleAction(action)}
            >
              {action.icon}
              {action.label}
            </Button>
          );
        })}

        <div className="h-4 w-px bg-[var(--color-border)]" />

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>
    </div>
  );
}
