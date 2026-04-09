"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  Download,
  Eye,
  ExternalLink,
  FileText,
  ChevronDown,
  ChevronUp,
  Flag,
  Star,
  Check,
  Clock,
  PhoneCall,
  Mail as MailIcon,
  MailCheck,
  Calendar,
  MessageSquare,
  User as UserIcon,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { applicationService } from "@/services/application.service";
import { roleService } from "@/services/role.service";
import { companyService } from "@/services/company.service";
import { EmailComposerModal } from "@/components/EmailComposerModal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

const STAGE_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  flag: Flag,
  check: Check,
  star: Star,
  clock: Clock,
  phone: PhoneCall,
  mail: MailIcon,
  calendar: Calendar,
  message: MessageSquare,
  user: UserIcon,
  settings: Settings,
};

function FieldRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-[var(--color-text-muted)] mb-0.5">
        {label}
      </p>
      <p className="text-sm text-[var(--color-text-primary)] flex items-center gap-1.5">
        {icon}
        {value.startsWith("http") ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-brand-600)] hover:underline"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [fileLoadingField, setFileLoadingField] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewField, setPreviewField] = useState<string | null>(null);
  const [timelineStageId, setTimelineStageId] = useState<string>("");
  const [timelineDescription, setTimelineDescription] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { data: application, isLoading } = useQuery({
    queryKey: ["application", id],
    queryFn: () => applicationService.getById(Number(id)),
  });

  const { data: role } = useQuery({
    queryKey: ["role", application?.roleId],
    queryFn: () => roleService.getById(application!.roleId),
    enabled: !!application?.roleId,
  });

  const { data: company } = useQuery({ queryKey: ["company"], queryFn: companyService.get });

  const stageMutation = useMutation({
    mutationFn: ({ stageId }: { stageId: number | null }) =>
      applicationService.moveStage(Number(id), stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const addTimelineMutation = useMutation({
    mutationFn: ({
      stageId,
      description,
    }: {
      stageId: number;
      description: string;
    }) => applicationService.addTimeline(Number(id), { stageId, description }),
    onSuccess: () => {
      setTimelineDescription("");
      setTimelineStageId("");
      queryClient.invalidateQueries({ queryKey: ["application", id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const stages = role?.stages ?? [];

  useEffect(() => {
    if (!application || stages.length === 0 || timelineStageId) return;
    const current = application.currentStageId ?? stages[0]?.id;
    if (current) setTimelineStageId(String(current));
  }, [application, stages, timelineStageId]);

  useEffect(() => {
    const applicantName = application?.formData?.full_name as string | undefined;
    const roleName = application?.role?.name;
    const companyName = company?.name;
    if (applicantName && roleName && companyName) {
      document.title = `${applicantName} — ${roleName} | ${companyName}`;
    }
    return () => {
      document.title = "Clever HR";
    };
  }, [application, company]);

  const handleOpenFile = async (
    fieldId: string,
    mode: "download" | "preview" | "tab",
  ) => {
    setFileLoadingField(fieldId);
    try {
      const url = await applicationService.getFileUrl(Number(id), fieldId);
      if (mode === "download") {
        const a = document.createElement("a");
        a.href = url;
        a.download = "";
        a.click();
      } else if (mode === "preview") {
        if (previewField === fieldId) {
          // Toggle off if already previewing this field
          setPreviewUrl(null);
          setPreviewField(null);
        } else {
          setPreviewUrl(url);
          setPreviewField(fieldId);
        }
      } else {
        window.open(url, "_blank");
      }
    } finally {
      setFileLoadingField(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[var(--color-text-muted)]">
          Application not found.
        </p>
        <Link href="/dashboard/applications">
          <Button variant="ghost" size="sm" className="mt-3">
            Back to Applications
          </Button>
        </Link>
      </div>
    );
  }

  const fullName = String(application.formData?.full_name ?? "—");
  const email = String(application.formData?.email ?? "");
  const phone = String(application.formData?.phone ?? "");
  const emailHistory = application.emails ?? [];
  const emails = application.emails ?? [];

  const customFieldValues = Object.entries(application.formData ?? {}).filter(
    ([k]) => k !== "full_name" && k !== "email" && k !== "phone",
  );

  const fileFields = role?.customFields.filter((f) => f.type === "file") ?? [];
  const hasResume = application.resumeS3Key;

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));

  const score = (application as typeof application & { score?: number; breakdown?: Array<{ ruleId: number; ruleName: string; score: number; matched: boolean }> }).score;
  const breakdown = (application as typeof application & { score?: number; breakdown?: Array<{ ruleId: number; ruleName: string; score: number; matched: boolean }> }).breakdown ?? [];

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          {email && (
            <Button variant="secondary" size="sm" onClick={() => setEmailModalOpen(true)}>
              <Mail className="h-3.5 w-3.5" />
              Email
            </Button>
          )}
          {phone && (
            <a href={`tel:${phone}`}>
              <Button variant="secondary" size="sm">
                <Phone className="h-3.5 w-3.5" />
                Call
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

        {/* ── Left column: main content ── */}
        <div className="space-y-4 min-w-0">

          {/* Candidate identity card */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-4">
                <Avatar name={fullName} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{fullName}</h2>
                    <span className="text-xs text-[var(--color-text-muted)]">#{application.id}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ backgroundColor: `${application.role.color}1A`, color: application.role.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: application.role.color }} />
                      {application.role.name}
                    </span>
                    {application.currentStage ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                        style={{ backgroundColor: `${application.currentStage.color}1A`, color: application.currentStage.color }}
                      >
                        {(() => { const Icon = STAGE_ICON_MAP[application.currentStage!.icon] ?? Flag; return <Icon className="h-3 w-3" />; })()}
                        {application.currentStage.name}
                      </span>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                    {score !== undefined && score > 0 && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        +{score} pts
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    {email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />{email}
                      </span>
                    )}
                    {phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />{phone}
                      </span>
                    )}
                    <span>Applied {formatDate(application.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application details */}
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
              <p className="text-xs text-[var(--color-text-muted)]">Information provided by the candidate</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldRow label="Full Name" value={fullName} />
              {email && <FieldRow label="Email" value={email} icon={<Mail className="h-3.5 w-3.5 text-[var(--color-brand-500)]" />} />}
              {phone && <FieldRow label="Phone" value={phone} icon={<Phone className="h-3.5 w-3.5 text-[var(--color-brand-500)]" />} />}
              {customFieldValues.map(([key, val]) => {
                const fieldDef = role?.customFields.find((f) => f.id === key);
                if (fieldDef?.type === "file") return null;
                const label = fieldDef?.label ?? key;
                const icon = fieldDef?.type === "url" ? <Globe className="h-3.5 w-3.5 text-[var(--color-brand-500)]" /> : undefined;
                return <FieldRow key={key} label={label} value={String(val)} icon={icon} />;
              })}
            </CardContent>
          </Card>

          {/* Resume / File fields */}
          {(hasResume || fileFields.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Resume & Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fileFields.map((field) => (
                  <div key={field.id} className="space-y-3">
                    <div className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-5 w-5 text-[var(--color-text-muted)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{field.label}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">PDF / DOC</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleOpenFile(field.id, "preview")} disabled={fileLoadingField === field.id}>
                          <Eye className="h-3.5 w-3.5" />
                          {previewField === field.id ? "Hide" : "Preview"}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleOpenFile(field.id, "download")} disabled={fileLoadingField === field.id}>
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenFile(field.id, "tab")} disabled={fileLoadingField === field.id} title="Open in new tab">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {previewField === field.id && previewUrl && (
                      <div className="rounded-[var(--radius)] border border-[var(--color-border)] overflow-hidden">
                        <iframe src={previewUrl} className="w-full" style={{ height: "70vh" }} title={`Preview — ${field.label}`} />
                      </div>
                    )}
                  </div>
                ))}
                {hasResume && fileFields.length === 0 && (
                  <div className="rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[var(--color-text-muted)]" />
                    <p className="text-sm text-[var(--color-text-muted)]">Resume file attached</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Email history */}
          <Card>
            <CardHeader>
              <CardTitle>Email History</CardTitle>
              <p className="text-xs text-[var(--color-text-muted)]">Sent emails for this application</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailHistory.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No emails sent yet.</p>
              ) : (
                emailHistory.map((mail) => {
                  const isFailed = mail.status === "failed";
                  const tone = isFailed
                    ? { border: "border-red-100", glow: "shadow-[0_10px_30px_-18px_rgba(239,68,68,0.6)]", accent: "from-red-50 via-white to-white", chip: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500", label: "Failed", Icon: AlertTriangle }
                    : { border: "border-emerald-100", glow: "shadow-[0_10px_30px_-18px_rgba(16,185,129,0.55)]", accent: "from-emerald-50 via-white to-white", chip: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Sent", Icon: MailCheck };

                  const sentAt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(mail.createdAt));

                  return (
                    <div key={mail.id} className={`relative overflow-hidden rounded-[var(--radius)] bg-white ${tone.border} ring-1 ring-inset ring-white/50 ${tone.glow}`}>
                      <div className={`absolute inset-0 bg-gradient-to-r ${tone.accent} opacity-90`} />
                      <div className="relative p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white shadow-sm">
                            <tone.Icon className="h-4 w-4 text-[var(--color-text-primary)]" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{mail.subject || "No subject"}</p>
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone.chip}`}>
                                <span className={`h-2 w-2 rounded-full ${tone.dot}`} />{tone.label}
                              </span>
                              {mail.templateId && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-white/70 px-2 py-0.5 text-[11px] text-[var(--color-text-muted)]">
                                  Template #{mail.templateId}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-[11px]">
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700"><Mail className="h-3 w-3" /> {mail.to}</span>
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700"><Clock className="h-3 w-3" /> {sentAt}</span>
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700"><UserIcon className="h-3 w-3" /> {mail.sender?.name ?? "Unknown"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-white/85 p-3 text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">{mail.body}</div>
                        {mail.error && (
                          <div className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700">
                            <AlertTriangle className="h-3.5 w-3.5" />Error: {mail.error}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4 lg:sticky lg:top-4">

          {/* Pipeline stage */}
          {stages.length > 0 && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">Pipeline Stage</p>
                <Select
                  value={application.currentStageId ? String(application.currentStageId) : "none"}
                  onValueChange={(val) => stageMutation.mutate({ stageId: val === "none" ? null : Number(val) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Not placed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not placed</SelectItem>
                    {stages.map((s) => {
                      const Icon = STAGE_ICON_MAP[s.icon] ?? Flag;
                      return (
                        <SelectItem key={s.id} value={String(s.id)}>
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                            <Icon className="h-3.5 w-3.5" />
                            {s.name}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Score */}
          {score !== undefined && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">Score</p>
                  {breakdown.length > 0 && (
                    <button
                      className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-0.5 transition-colors"
                      onClick={() => setShowBreakdown((v) => !v)}
                    >
                      Breakdown {showBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  )}
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold border ${score > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border-[var(--color-border)]"}`}>
                  {score > 0 ? `+${score}` : score}
                </span>
                {showBreakdown && breakdown.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {breakdown.map((r) => (
                      <div key={r.ruleId} className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${r.matched ? "bg-emerald-500" : "bg-[var(--color-text-muted)]"}`} />
                          <span className="text-sm text-[var(--color-text-primary)]">{r.ruleName}</span>
                        </div>
                        <span className={`text-xs font-semibold ${r.matched ? "text-emerald-600" : "text-[var(--color-text-muted)]"}`}>
                          {r.matched ? `+${r.score}` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stages.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No stages defined for this role yet.</p>
              ) : (
                <form
                  className="space-y-3 pb-4 border-b border-[var(--color-border)]"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!timelineStageId) return;
                    addTimelineMutation.mutate({ stageId: Number(timelineStageId), description: timelineDescription.trim() });
                  }}
                >
                  <Select value={timelineStageId} onValueChange={setTimelineStageId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((s) => {
                        const Icon = STAGE_ICON_MAP[s.icon] ?? Flag;
                        return (
                          <SelectItem key={s.id} value={String(s.id)}>
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                              <Icon className="h-3.5 w-3.5" />
                              {s.name}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <textarea
                    value={timelineDescription}
                    onChange={(e) => setTimelineDescription(e.target.value)}
                    placeholder="Add notes (optional)"
                    rows={2}
                    className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
                  />
                  <Button type="submit" size="sm" className="w-full" disabled={addTimelineMutation.isPending}>
                    {addTimelineMutation.isPending ? "Adding…" : "Add Milestone"}
                  </Button>
                </form>
              )}

              {(application.timeline ?? []).length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No milestones yet.</p>
              ) : (
                <div className="relative space-y-0">
                  {(application.timeline ?? []).map((item, i) => {
                    const stage = stages.find((s) => s.id === item.stageId);
                    const color = stage?.color ?? "#22c55e";
                    const Icon = stage ? (STAGE_ICON_MAP[stage.icon] ?? Flag) : Flag;
                    const dateLabel = new Date(item.createdAt).toISOString().slice(0, 10);
                    const isLast = i === (application.timeline ?? []).length - 1;
                    return (
                      <div key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
                        <div className="shrink-0">
                          <div className="h-7 w-7 rounded-full border-2 flex items-center justify-center shadow-sm" style={{ borderColor: color, backgroundColor: `${color}1A` }}>
                            <Icon className="h-3.5 w-3.5" style={{ color }} />
                          </div>
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{stage?.name ?? "Stage updated"}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{dateLabel}</p>
                          {item.description && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{item.description}</p>}
                        </div>
                        {!isLast && <div className="absolute left-3.5 top-8 bottom-1 w-px bg-[var(--color-border)]" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meta */}
          <Card>
            <CardContent className="pt-4 pb-4 space-y-3">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Applied</p>
                <p className="text-sm text-[var(--color-text-primary)] mt-0.5">{formatDate(application.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Last updated</p>
                <p className="text-sm text-[var(--color-text-primary)] mt-0.5">{formatDateTime(application.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Email composer modal */}
      {email && (
        <EmailComposerModal
          open={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          applicationId={Number(id)}
          candidateEmail={email}
          candidateName={fullName}
        />
      )}
    </div>
  );
}
