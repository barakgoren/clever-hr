'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, BookTemplate, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { emailService } from '@/services/email.service';
import { usePlan } from '@/hooks/usePlan';

interface EmailComposerModalProps {
  open: boolean;
  onClose: () => void;
  applicationId: number;
  candidateEmail: string;
  candidateName: string;
  onSent?: (status: 'sent' | 'failed') => void;
}

export function EmailComposerModal({
  open,
  onClose,
  applicationId,
  candidateEmail,
  candidateName,
  onSent,
}: EmailComposerModalProps) {
  const queryClient = useQueryClient();
  const { isAtEmailLimit, usage, limits } = usePlan();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: emailService.listTemplates,
    enabled: open,
  });

  useEffect(() => {
    if (!selectedTemplateId || selectedTemplateId === 'none') return;
    const tmpl = templates.find((t) => String(t.id) === selectedTemplateId);
    if (tmpl) {
      setSubject(tmpl.subject);
      setBody(tmpl.body);
    }
  }, [selectedTemplateId, templates]);

  useEffect(() => {
    if (open) {
      setSubject('');
      setBody('');
      setSelectedTemplateId('');
      setStatus('idle');
      setErrorMsg('');
    }
  }, [open]);

  const sendMutation = useMutation({
    mutationFn: () =>
      emailService.sendToApplicant(applicationId, {
        to: candidateEmail,
        subject,
        body,
        templateId: selectedTemplateId && selectedTemplateId !== 'none' ? Number(selectedTemplateId) : undefined,
      }),
    onSuccess: (sendStatus) => {
      queryClient.invalidateQueries({ queryKey: ['company-usage'] });
      if (sendStatus === 'sent') {
        setStatus('success');
        queryClient.invalidateQueries({ queryKey: ['application', String(applicationId)] });
        queryClient.invalidateQueries({ queryKey: ['applications'] });
        setTimeout(onClose, 1200);
      } else {
        setStatus('error');
        setErrorMsg('Email could not be sent. It has been logged in the history below.');
      }
      onSent?.(sendStatus);
    },
    onError: (err: Error) => {
      setStatus('error');
      setErrorMsg(err.message ?? 'Failed to send email.');
      onSent?.('failed');
    },
  });

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && !sendMutation.isPending && !isAtEmailLimit;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Email Candidate</DialogTitle>
          <DialogDescription>
            Sending to <strong>{candidateName}</strong> ({candidateEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {limits?.emailsPerMonth != null && (
            <div className={`rounded-[var(--radius)] border px-3 py-2 text-xs ${isAtEmailLimit ? 'border-red-200 bg-red-50 text-red-700 font-semibold' : 'border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]'}`}>
              {usage?.emailsSentThisMonth ?? 0} / {limits.emailsPerMonth} emails sent this month
              {isAtEmailLimit && ' — limit reached'}
            </div>
          )}
          {isAtEmailLimit && (
            <p className="rounded-[var(--radius)] bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700">
              Monthly email limit reached. Emails will reset on the 1st of next month.
            </p>
          )}
          {templates.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1 block">
                <BookTemplate className="inline h-3.5 w-3.5 mr-1" />
                Use saved template
              </label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1 block">
              Subject
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject…"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1 block">
              Message
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Hi ${candidateName},\n\nWrite your message here…`}
              rows={8}
              className="resize-none"
            />
            <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
              Tip: use <code>{'{{candidateName}}'}</code>, <code>{'{{roleName}}'}</code>, <code>{'{{companyName}}'}</code> as variables.
            </p>
          </div>

          {status === 'success' && (
            <p className="rounded-[var(--radius)] bg-green-50 px-3 py-2 text-sm text-green-700">
              Email sent successfully!
            </p>
          )}
          {status === 'error' && (
            <p className="rounded-[var(--radius)] bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMsg}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={sendMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => sendMutation.mutate()} disabled={!canSend}>
            {sendMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
