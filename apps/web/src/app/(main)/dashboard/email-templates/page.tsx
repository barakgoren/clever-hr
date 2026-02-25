'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Mail, X, Loader2, Check } from 'lucide-react';
import { emailService, EmailTemplate } from '@/services/email.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TemplateFormState {
  name: string;
  subject: string;
  body: string;
}

const EMPTY_FORM: TemplateFormState = { name: '', subject: '', body: '' };

function TemplateForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial: TemplateFormState;
  onSave: (v: TemplateFormState) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<TemplateFormState>(initial);
  const set = (k: keyof TemplateFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const valid = form.name.trim() && form.subject.trim() && form.body.trim();

  return (
    <div className="space-y-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1 block">Template Name</label>
          <Input value={form.name} onChange={set('name')} placeholder="e.g. Interview Invite" />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1 block">Subject</label>
          <Input value={form.subject} onChange={set('subject')} placeholder="Email subject…" />
        </div>
      </div>
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1 block">Body</label>
        <Textarea
          value={form.body}
          onChange={set('body')}
          rows={6}
          placeholder={'Hi {{candidateName}},\n\nWrite your template body here…'}
          className="resize-none font-mono text-sm"
        />
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
          Available variables: <code>{'{{candidateName}}'}</code>, <code>{'{{roleName}}'}</code>, <code>{'{{companyName}}'}</code>
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button size="sm" onClick={() => onSave(form)} disabled={!valid || isPending}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save Template
        </Button>
      </div>
    </div>
  );
}

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: emailService.listTemplates,
  });

  const createMutation = useMutation({
    mutationFn: emailService.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setShowNewForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TemplateFormState> }) =>
      emailService.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: emailService.deleteTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email-templates'] }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Email Templates</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Reusable templates for candidate communication
          </p>
        </div>
        {!showNewForm && (
          <Button size="sm" onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        )}
      </div>

      {/* New template form */}
      {showNewForm && (
        <TemplateForm
          initial={EMPTY_FORM}
          onSave={(v) => createMutation.mutate(v)}
          onCancel={() => setShowNewForm(false)}
          isPending={createMutation.isPending}
        />
      )}

      {/* Templates list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : templates.length === 0 && !showNewForm ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Mail className="h-10 w-10 text-[var(--color-text-muted)] mb-3" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">No email templates yet</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Create reusable templates to quickly email candidates.
            </p>
            <Button size="sm" className="mt-4" onClick={() => setShowNewForm(true)}>
              <Plus className="h-4 w-4" />
              Create first template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((tmpl: EmailTemplate) =>
            editingId === tmpl.id ? (
              <TemplateForm
                key={tmpl.id}
                initial={{ name: tmpl.name, subject: tmpl.subject, body: tmpl.body }}
                onSave={(v) => updateMutation.mutate({ id: tmpl.id, data: v })}
                onCancel={() => setEditingId(null)}
                isPending={updateMutation.isPending}
              />
            ) : (
              <Card key={tmpl.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm">{tmpl.name}</CardTitle>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)] truncate">
                        Subject: {tmpl.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(tmpl.id)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => {
                          if (confirm(`Delete template "${tmpl.name}"?`)) {
                            deleteMutation.mutate(tmpl.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-xs text-[var(--color-text-muted)] line-clamp-3 font-sans">
                    {tmpl.body}
                  </pre>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
