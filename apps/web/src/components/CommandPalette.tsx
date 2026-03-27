'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Briefcase, User, Mail, Loader2 } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { searchService } from '@/services/search.service';
import type { SearchResult } from '@repo/shared';
import { cn } from '@/lib/utils';

// ─── Badge helpers (mirrors the exact style used in ApplicationsPage) ─────────

function RoleDotBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

function StageBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {name}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
      +{score}
    </span>
  );
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-[var(--color-surface-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-muted)] border border-[var(--color-border)]">
      Inactive
    </span>
  );
}

// ─── Result row renderers ─────────────────────────────────────────────────────

function RoleResultRow({ result }: { result: SearchResult }) {
  const color = result.color ?? '#6366f1';
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}1A` }}
      >
        <Briefcase className="h-3.5 w-3.5" style={{ color }} />
      </span>
      <span className="flex flex-col min-w-0 gap-1">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">{result.title}</span>
          {result.isActive !== undefined && <ActiveBadge isActive={result.isActive} />}
        </span>
        {result.subtitle && (
          <span className="text-xs text-[var(--color-text-muted)] truncate capitalize">{result.subtitle}</span>
        )}
      </span>
    </div>
  );
}

function ApplicationResultRow({ result }: { result: SearchResult }) {
  const initials = result.title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-subtle)] text-[10px] font-bold text-[var(--color-text-secondary)]">
        {initials}
      </span>
      <span className="flex flex-col min-w-0 gap-1">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">{result.title}</span>
        <span className="flex items-center gap-1.5 flex-wrap">
          {result.roleName && result.roleColor && (
            <RoleDotBadge name={result.roleName} color={result.roleColor} />
          )}
          {result.stageName && result.stageColor && (
            <StageBadge name={result.stageName} color={result.stageColor} />
          )}
          {result.score !== undefined && result.score > 0 && (
            <ScoreBadge score={result.score} />
          )}
        </span>
      </span>
    </div>
  );
}

function EmailTemplateResultRow({ result }: { result: SearchResult }) {
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50">
        <Mail className="h-3.5 w-3.5 text-violet-600" />
      </span>
      <span className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">{result.title}</span>
        {result.subtitle && (
          <span className="text-xs text-[var(--color-text-muted)] truncate">{result.subtitle}</span>
        )}
      </span>
    </div>
  );
}

// ─── Group config ─────────────────────────────────────────────────────────────

const GROUPS: {
  type: SearchResult['type'];
  label: string;
}[] = [
  { type: 'role', label: 'Roles' },
  { type: 'application', label: 'Applications' },
  { type: 'emailTemplate', label: 'Email Templates' },
];

function resultHref(result: SearchResult): string {
  switch (result.type) {
    case 'role': return `/dashboard/templates/${result.id}/edit`;
    case 'application': return `/dashboard/applications/${result.id}`;
    case 'emailTemplate': return `/dashboard/email-templates`;
  }
}

function groupResults(results: SearchResult[]) {
  const map = new Map<SearchResult['type'], SearchResult[]>();
  for (const r of results) {
    if (!map.has(r.type)) map.set(r.type, []);
    map.get(r.type)!.push(r);
  }
  return map;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchService.search(query.trim());
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onOpenChange(false);
      router.push(resultHref(result));
    },
    [router, onOpenChange]
  );

  const grouped = groupResults(results);
  const hasResults = results.length > 0;
  const showEmpty = !loading && query.trim().length > 0 && !hasResults;
  const visibleGroups = GROUPS.filter((g) => grouped.has(g.type));

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="cmd-overlay fixed inset-0 z-50 bg-white/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="cmd-dialog fixed left-[50%] top-[12vh] z-50 w-full max-w-[580px] max-h-[calc(100vh-16vh)] flex flex-col rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl overflow-hidden"
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>

          <Command shouldFilter={false} className="flex flex-col min-h-0 flex-1">
            {/* Search input row */}
            <div className="flex items-center px-4 border-b border-[var(--color-border)]">
              {loading
                ? <Loader2 className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] animate-spin" />
                : <Search className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
              }
              <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder="Search roles, applicants, email templates..."
                className="flex-1 border-0 focus:ring-0 px-3 py-0 h-12"
              />
              <kbd className="hidden sm:inline-flex ml-auto shrink-0 items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-1.5 py-1 font-mono text-[10px] text-[var(--color-text-muted)]">
                esc
              </kbd>
            </div>

            <CommandList className="flex-1 overflow-y-auto">
              {/* Empty state */}
              {showEmpty && (
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-1 py-8">
                    <Search className="h-8 w-8 text-[var(--color-border)]" />
                    <p className="text-sm font-medium text-[var(--color-text-primary)] mt-2">No results for &ldquo;{query}&rdquo;</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Try a different search term</p>
                  </div>
                </CommandEmpty>
              )}

              {/* Idle state */}
              {!query.trim() && !loading && (
                <div className="flex flex-col items-center gap-1 py-10 text-center">
                  <Search className="h-8 w-8 text-[var(--color-border)]" />
                  <p className="text-sm font-medium text-[var(--color-text-primary)] mt-2">Search anything</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Roles, applicants, email templates</p>
                </div>
              )}

              {/* Results */}
              {hasResults && visibleGroups.map(({ type, label }, idx) => {
                const items = grouped.get(type)!;
                return (
                  <div key={type}>
                    {idx > 0 && <CommandSeparator />}
                    <CommandGroup heading={label}>
                      {items.map((result) => (
                        <CommandItem
                          key={`${result.type}-${result.id}`}
                          value={`${result.type}-${result.id}`}
                          onSelect={() => handleSelect(result)}
                          className="py-2.5 px-3"
                        >
                          {type === 'role' && <RoleResultRow result={result} />}
                          {type === 'application' && <ApplicationResultRow result={result} />}
                          {type === 'emailTemplate' && <EmailTemplateResultRow result={result} />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </div>
                );
              })}
            </CommandList>

            {/* Footer hint */}
            {hasResults && (
              <div className="flex items-center gap-3 border-t border-[var(--color-border)] px-4 py-2">
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-1 py-0.5 font-mono text-[10px]">↑</kbd>
                  <kbd className="ml-1 rounded border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-1 py-0.5 font-mono text-[10px]">↓</kbd>
                  {' '}navigate
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-1 py-0.5 font-mono text-[10px]">↵</kbd>
                  {' '}open
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-1 py-0.5 font-mono text-[10px]">esc</kbd>
                  {' '}close
                </span>
              </div>
            )}
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
