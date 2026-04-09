"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Flag, Star, Check, Clock, PhoneCall, Mail, Calendar, MessageSquare, User, Plus, Trash2, X, Settings, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { roleService } from "@/services/role.service";
import { stageService } from "@/services/stage.service";
import { ruleService } from "@/services/rule.service";
import { usePlan } from "@/hooks/usePlan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Role, CustomField, FieldType, RoleType, Stage, Rule, RuleCondition, ConditionType } from "@repo/shared";

type RoleFormData = {
  name: string;
  description: string;
  location: string;
  type: RoleType;
  seniorityLevel: string;
  requirements: string[];
  isActive: boolean;
  customFields: CustomField[];
};

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Tel" },
  { value: "url", label: "Url" },
  { value: "file", label: "File" },
  { value: "checkbox", label: "Checkbox" },
  { value: "select", label: "Select" },
];

const ROLE_TYPES: { value: RoleType; label: string }[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];

const STAGE_ICONS = [
  { value: "flag", label: "Flag", Icon: Flag },
  { value: "check", label: "Check", Icon: Check },
  { value: "star", label: "Star", Icon: Star },
  { value: "clock", label: "Clock", Icon: Clock },
  { value: "phone", label: "Phone", Icon: PhoneCall },
  { value: "mail", label: "Mail", Icon: Mail },
  { value: "calendar", label: "Calendar", Icon: Calendar },
  { value: "message", label: "Message", Icon: MessageSquare },
  { value: "user", label: "User", Icon: User },
  { value: "settings", label: "Settings", Icon: Settings },
];

const SYSTEM_FIELDS: CustomField[] = [
  { id: "full_name", label: "Full Name", type: "text", required: true, system: true },
  { id: "email", label: "Email", type: "email", required: true, system: true },
];

function withSystemFields(customFields: CustomField[]): CustomField[] {
  const nonSystem = customFields.filter((f) => !f.system);
  return [...SYSTEM_FIELDS, ...nonSystem];
}

function newField(): CustomField {
  return { id: crypto.randomUUID().slice(0, 8), label: "", type: "text" };
}

export function RoleForm({ role }: { role?: Role }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { stagesAtLimit } = usePlan();
  const atStageLimit = role ? stagesAtLimit(role.id) : false;

  const [form, setForm] = useState<RoleFormData>({
    name: role?.name ?? "",
    description: role?.description ?? "",
    location: role?.location ?? "",
    type: role?.type ?? "full_time",
    seniorityLevel: role?.seniorityLevel ?? "",
    requirements: role?.requirements ?? [],
    isActive: role?.isActive ?? true,
    customFields: withSystemFields(role?.customFields ?? []),
  });

  const [requirementInput, setRequirementInput] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof RoleFormData, string>>>({});
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#6366f1");
  const [newStageIcon, setNewStageIcon] = useState("flag");
  const [stageDrafts, setStageDrafts] = useState<Record<number, { name: string; color: string; icon: string }>>({});

  // Rules state
  type RuleDraft = { name: string; score: string; conditions: Array<{ type: ConditionType; fieldId: string; value: string; fileType: string }> };
  const emptyRuleDraft = (): RuleDraft => ({ name: "", score: "", conditions: [{ type: "field_contains", fieldId: "", value: "", fileType: "pdf" }] });
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [ruleDraft, setRuleDraft] = useState<RuleDraft>(emptyRuleDraft());
  const [expandedBreakdown, setExpandedBreakdown] = useState<number | null>(null);

  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ["stages", role?.id],
    queryFn: () => stageService.list(role!.id),
    enabled: !!role,
    initialData: role?.stages ?? [],
  });

  useEffect(() => {
    if (!stages.length) return;
    setStageDrafts(Object.fromEntries(stages.map((s) => [s.id, { name: s.name, color: s.color ?? "#6366f1", icon: s.icon ?? "flag" }])));
  }, [stages]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        description: form.description || null,
        location: form.location || null,
        type: form.type,
        seniorityLevel: form.seniorityLevel || null,
        requirements: form.requirements,
        isActive: form.isActive,
        customFields: form.customFields,
      };
      return role
        ? roleService.update(role.id, payload)
        : roleService.create({
            ...payload,
            description: payload.description ?? undefined,
            location: payload.location ?? undefined,
            seniorityLevel: payload.seniorityLevel ?? undefined,
          });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      router.push("/dashboard/templates");
    },
  });

  const invalidateRoleQueries = () => {
    if (!role) return;
    queryClient.invalidateQueries({ queryKey: ["stages", role.id] });
    queryClient.invalidateQueries({ queryKey: ["role", role.id] });
    queryClient.invalidateQueries({ queryKey: ["roles"] });
  };

  const addStageMutation = useMutation({
    mutationFn: () =>
      stageService.create(role!.id, newStageName.trim(), undefined, {
        color: newStageColor,
        icon: newStageIcon,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-usage"] });
      setNewStageName("");
      setNewStageColor("#6366f1");
      setNewStageIcon("flag");
      invalidateRoleQueries();
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ stageId, patch }: { stageId: number; patch: { name?: string; order?: number; color?: string; icon?: string } }) => stageService.update(role!.id, stageId, patch),
    onSuccess: () => invalidateRoleQueries(),
  });

  const deleteStageMutation = useMutation({
    mutationFn: (stageId: number) => stageService.delete(role!.id, stageId),
    onSuccess: () => invalidateRoleQueries(),
  });

  const reorderStages = useMutation({
    mutationFn: async ({ from, to, snapshot }: { from: number; to: number; snapshot: Stage[] }) => {
      const reordered = [...snapshot];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      await Promise.all(reordered.map((stage, idx) => stageService.update(role!.id, stage.id, { order: idx + 1 })));
    },
    onSuccess: () => invalidateRoleQueries(),
  });

  const stageBusy = addStageMutation.isPending || updateStageMutation.isPending || deleteStageMutation.isPending || reorderStages.isPending;

  const { data: rules = [] } = useQuery<Rule[]>({
    queryKey: ["rules", role?.id],
    queryFn: () => ruleService.list(role!.id),
    enabled: !!role,
  });

  const saveRuleMutation = useMutation({
    mutationFn: (draft: RuleDraft) => {
      const conditions = draft.conditions.map((c) => ({
        type: c.type,
        fieldId: c.fieldId,
        ...(c.type === "file_is_type" ? { fileType: c.fileType as "pdf" | "doc" | "docx" } : { value: c.value }),
      })) as RuleCondition[];
      const payload = { name: draft.name, score: parseInt(draft.score), conditions };
      return editingRuleId
        ? ruleService.update(role!.id, editingRuleId, payload)
        : ruleService.create(role!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules", role?.id] });
      setShowRuleForm(false);
      setEditingRuleId(null);
      setRuleDraft(emptyRuleDraft());
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => ruleService.delete(role!.id, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules", role?.id] }),
  });

  const allFields = form.customFields;
  const fileFieldIds = new Set(allFields.filter((f) => f.type === "file").map((f) => f.id));

  function getConditionTypes(fieldId: string): { value: ConditionType; label: string }[] {
    if (!fieldId) return [];
    if (fileFieldIds.has(fieldId) || fieldId === "resume") {
      return [
        { value: "file_is_type", label: "File is type" },
        { value: "file_contains_keyword", label: "File contains keyword" },
      ];
    }
    return [
      { value: "field_equals", label: "Field equals" },
      { value: "field_contains", label: "Field contains" },
    ];
  }

  function startEditRule(rule: Rule) {
    setEditingRuleId(rule.id);
    setRuleDraft({
      name: rule.name,
      score: String(rule.score),
      conditions: rule.conditions.map((c) => ({
        type: c.type,
        fieldId: c.fieldId,
        value: c.value ?? "",
        fileType: c.fileType ?? "pdf",
      })),
    });
    setShowRuleForm(true);
  }

  function cancelRuleForm() {
    setShowRuleForm(false);
    setEditingRuleId(null);
    setRuleDraft(emptyRuleDraft());
  }

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Template name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    saveMutation.mutate();
  };

  const addRequirements = () => {
    const items = requirementInput
      .split("~")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!items.length) return;
    setForm((f) => ({ ...f, requirements: [...f.requirements, ...items] }));
    setRequirementInput("");
  };

  const removeRequirement = (idx: number) => {
    setForm((f) => ({
      ...f,
      requirements: f.requirements.filter((_, i) => i !== idx),
    }));
  };

  const addField = () => {
    setForm((f) => ({ ...f, customFields: [...f.customFields, newField()] }));
  };

  const updateField = (idx: number, patch: Partial<CustomField>) => {
    setForm((f) => ({
      ...f,
      customFields: f.customFields.map((cf, i) => (i === idx ? { ...cf, ...patch } : cf)),
    }));
  };

  const removeField = (idx: number) => {
    setForm((f) => ({
      ...f,
      customFields: f.customFields.filter((_, i) => i !== idx),
    }));
  };

  const handleAddStage = () => {
    if (!role) return;
    const name = newStageName.trim();
    if (!name) return;
    addStageMutation.mutate();
  };

  const handleRenameStage = (stageId: number) => {
    if (!role) return;
    const draft = stageDrafts[stageId];
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) return;
    updateStageMutation.mutate({
      stageId,
      patch: { name, color: draft.color, icon: draft.icon },
    });
  };

  const handleReorder = (from: number, to: number) => {
    if (!role || !stages || to < 0 || to >= stages.length || from === to) return;
    reorderStages.mutate({ from, to, snapshot: stages });
  };

  const handleDeleteStage = (stageId: number) => {
    if (!role) return;
    deleteStageMutation.mutate(stageId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Template Information */}
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Template Information</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Modify the template name, description, and status.</p>
        </div>

        <Input id="name" label="Template Name" placeholder="e.g. Senior Frontend Engineer" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} required />

        <Textarea id="description" label="Description" placeholder="Describe the role..." rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

        <Input id="location" label="Location" placeholder="e.g. Tel Aviv, New York, Remote" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">Type</label>
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RoleType }))} className="flex h-9 w-full items-center justify-between rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent">
            {ROLE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <Input id="seniorityLevel" label="Seniority Level" placeholder="e.g. Junior, Mid, Senior, Intermediate" value={form.seniorityLevel} onChange={(e) => setForm((f) => ({ ...f, seniorityLevel: e.target.value }))} />
      </section>

      {/* Qualifications */}
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Qualifications</h2>
          {form.requirements.length > 0 && (
            <Button type="button" variant="danger-ghost" size="sm" onClick={() => setForm((f) => ({ ...f, requirements: [] }))}>
              <X className="h-3.5 w-3.5" />
              Delete All Qualifications
            </Button>
          )}
        </div>

        {form.requirements.length > 0 && (
          <ul className="space-y-2">
            {form.requirements.map((req, idx) => (
              <li key={idx} className="flex items-center justify-between gap-2 text-sm text-[var(--color-text-primary)]">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-600)] shrink-0" />
                  {req}
                </span>
                <button type="button" onClick={() => removeRequirement(idx)} className="text-[var(--color-danger)] hover:text-red-700 transition-colors shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter qualifications (comma separated)"
            value={requirementInput}
            onChange={(e) => setRequirementInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRequirements();
              }
            }}
            className="flex-1 rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
          />
          <Button type="button" variant="ghost" size="icon" onClick={addRequirements}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-2.5 pt-2">
          <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))} />
          <label className="text-sm font-medium text-[var(--color-text-primary)]">Active Template</label>
        </div>
      </section>

      {/* Form Fields */}
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Form Fields</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Define the fields that will appear in your application form</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addField}>
            <Plus className="h-3.5 w-3.5" />
            Add Field
          </Button>
        </div>

        {form.customFields.filter((f) => !f.system).length === 0 && <p className="text-sm text-[var(--color-text-muted)] text-center py-2">No custom fields yet. Add fields to customize your application form.</p>}
        <div className="space-y-2">
          {form.customFields.map((field, idx) => (
            <div key={field.id} className={`flex items-center gap-2 rounded-[var(--radius)] border px-3 py-2 ${field.system ? "border-[var(--color-brand-200)] bg-[var(--color-brand-50)]" : "border-[var(--color-border)]"}`}>
              {field.system ? (
                <span className="w-40 flex items-center gap-1.5 text-xs font-mono text-[var(--color-brand-600)] select-none">
                  <Lock className="h-3 w-3 shrink-0" />
                  {field.id}
                </span>
              ) : (
                <input type="text" value={field.id} onChange={(e) => updateField(idx, { id: e.target.value })} placeholder="field_id" className="w-40 rounded border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]" />
              )}
              <input type="text" value={field.label} onChange={(e) => updateField(idx, { label: e.target.value })} placeholder="Display Label" className="flex-1 rounded border border-[var(--color-border)] bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]" />
              {field.system ? (
                <span className="w-28 h-8 flex items-center justify-center text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-subtle)] rounded border border-[var(--color-border)] select-none">{field.type}</span>
              ) : (
                <Select value={field.type} onValueChange={(v) => updateField(idx, { type: v as FieldType })}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {field.system ? (
                <span className="h-8 w-8 flex items-center justify-center text-[var(--color-brand-600)]" title="System field — cannot be removed">
                  <Lock className="h-3.5 w-3.5" />
                </span>
              ) : (
                <button type="button" onClick={() => removeField(idx)} className="text-[var(--color-danger)] hover:text-red-700 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline Stages */}
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Pipeline Stages</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Organize how candidates move through this template.</p>
          </div>
          {role ? (
            <div>
              <div className="flex items-center gap-2 w-[320px] max-w-full">
                <input
                  type="text"
                  value={newStageName}
                  placeholder={atStageLimit ? "Stage limit reached" : "Add a new stage"}
                  disabled={atStageLimit}
                  onChange={(e) => setNewStageName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddStage();
                    }
                  }}
                  className="flex-1 rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Button type="button" size="sm" disabled={!newStageName.trim() || stageBusy || atStageLimit} title={atStageLimit ? "Stage limit reached for your plan" : undefined} onClick={handleAddStage}>
                  Add Stage
                </Button>
              </div>
              <div>{atStageLimit && <p className="text-xs text-amber-600 mt-1 w-full">Stage limit reached for your plan (4 max on Team).</p>}</div>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">Save the template first to configure stages.</p>
          )}
        </div>

        {!role ? (
          <p className="text-sm text-[var(--color-text-muted)]">Create and save the template to start defining its pipeline.</p>
        ) : stagesLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-11 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] animate-pulse" />
            ))}
          </div>
        ) : stages.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No stages yet. Add a stage to define the pipeline.</p>
        ) : (
          <div className="space-y-2">
            {stages.map((stage, idx) => (
              <div key={stage.id} className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 py-2">
                <span className="w-10 text-xs font-semibold text-[var(--color-text-muted)]">#{idx + 1}</span>
                <input
                  type="text"
                  value={stageDrafts[stage.id]?.name ?? stage.name}
                  onChange={(e) =>
                    setStageDrafts((prev) => ({
                      ...prev,
                      [stage.id]: {
                        ...(prev[stage.id] ?? stage),
                        name: e.target.value,
                      },
                    }))
                  }
                  className="flex-1 rounded border border-[var(--color-border)] bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    aria-label="Stage color"
                    value={stageDrafts[stage.id]?.color ?? stage.color ?? "#6366f1"}
                    onChange={(e) =>
                      setStageDrafts((prev) => ({
                        ...prev,
                        [stage.id]: {
                          ...(prev[stage.id] ?? stage),
                          color: e.target.value,
                        },
                      }))
                    }
                    className="h-9 w-10 rounded border border-[var(--color-border)] bg-white px-1 py-1"
                  />
                  <Select
                    value={stageDrafts[stage.id]?.icon ?? stage.icon ?? "flag"}
                    onValueChange={(v) =>
                      setStageDrafts((prev) => ({
                        ...prev,
                        [stage.id]: { ...(prev[stage.id] ?? stage), icon: v },
                      }))
                    }
                  >
                    <SelectTrigger className="w-28 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGE_ICONS.map(({ value, label, Icon }) => (
                        <SelectItem key={value} value={value}>
                          <span className="inline-flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" disabled={idx === 0 || stageBusy} onClick={() => handleReorder(idx, idx - 1)} title="Move up">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" disabled={idx === stages.length - 1 || stageBusy} onClick={() => handleReorder(idx, idx + 1)} title="Move down">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="secondary" size="sm" disabled={stageBusy} onClick={() => handleRenameStage(stage.id)}>
                    Save
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]" disabled={stageBusy} onClick={() => handleDeleteStage(stage.id)} title="Delete stage">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Scoring Rules */}
      {role && (
        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Scoring Rules</h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Automatically score applicants based on field values or file content.</p>
            </div>
            {!showRuleForm && (
              <Button type="button" variant="secondary" size="sm" onClick={() => { setEditingRuleId(null); setRuleDraft(emptyRuleDraft()); setShowRuleForm(true); }}>
                <Plus className="h-3.5 w-3.5" />
                Add Rule
              </Button>
            )}
          </div>

          {/* Rule list */}
          {rules.length === 0 && !showRuleForm && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-2">No rules yet. Add a rule to automatically score applicants.</p>
          )}
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{rule.name}</span>
                    <span className="inline-flex items-center rounded-full bg-[var(--color-brand-50)] px-2 py-0.5 text-xs font-semibold text-[var(--color-brand-600)] border border-[var(--color-brand-200)]">+{rule.score}</span>
                    <button
                      type="button"
                      className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-0.5"
                      onClick={() => setExpandedBreakdown(expandedBreakdown === rule.id ? null : rule.id)}
                    >
                      {rule.conditions.length} condition{rule.conditions.length !== 1 ? "s" : ""}
                      {expandedBreakdown === rule.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button type="button" variant="secondary" size="sm" onClick={() => startEditRule(rule)}>Edit</Button>
                    <Button type="button" variant="ghost" size="icon" className="text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]" disabled={deleteRuleMutation.isPending} onClick={() => deleteRuleMutation.mutate(rule.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {expandedBreakdown === rule.id && (
                  <ul className="mt-2 space-y-1 pl-2 border-l-2 border-[var(--color-brand-200)]">
                    {rule.conditions.map((c, i) => (
                      <li key={i} className="text-xs text-[var(--color-text-muted)]">
                        <span className="font-mono">{c.fieldId}</span> {c.type.replace(/_/g, " ")}
                        {c.value ? <> &quot;{c.value}&quot;</> : null}
                        {c.fileType ? <> ({c.fileType})</> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Rule form */}
          {showRuleForm && (
            <div className="rounded-[var(--radius)] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-4 space-y-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{editingRuleId ? "Edit Rule" : "New Rule"}</h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Rule Name</label>
                  <input
                    type="text"
                    value={ruleDraft.name}
                    onChange={(e) => setRuleDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="e.g. Has Python experience"
                    className="mt-1 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
                  />
                </div>
                <div className="w-28">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Score</label>
                  <input
                    type="number"
                    min="1"
                    value={ruleDraft.score}
                    onChange={(e) => setRuleDraft((d) => ({ ...d, score: e.target.value }))}
                    placeholder="e.g. 10"
                    className="mt-1 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Conditions (ALL must match)</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRuleDraft((d) => ({ ...d, conditions: [...d.conditions, { type: "field_contains", fieldId: "", value: "", fileType: "pdf" }] }))}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Condition
                  </Button>
                </div>
                {ruleDraft.conditions.map((cond, idx) => {
                  const condTypes = getConditionTypes(cond.fieldId);
                  const isFileCondition = cond.type === "file_is_type" || cond.type === "file_contains_keyword";
                  return (
                    <div key={idx} className="flex items-center gap-2 flex-wrap">
                      {/* Field selector */}
                      <select
                        value={cond.fieldId}
                        onChange={(e) => {
                          const newFieldId = e.target.value;
                          const newTypes = getConditionTypes(newFieldId);
                          setRuleDraft((d) => ({
                            ...d,
                            conditions: d.conditions.map((c, i) =>
                              i === idx ? { ...c, fieldId: newFieldId, type: newTypes[0]?.value ?? "field_contains" } : c
                            ),
                          }));
                        }}
                        className="rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
                      >
                        <option value="">Select field…</option>
                        {allFields.map((f) => (
                          <option key={f.id} value={f.id}>{f.label || f.id}</option>
                        ))}
                      </select>
                      {/* Condition type */}
                      {condTypes.length > 0 && (
                        <select
                          value={cond.type}
                          onChange={(e) => setRuleDraft((d) => ({
                            ...d,
                            conditions: d.conditions.map((c, i) => i === idx ? { ...c, type: e.target.value as ConditionType } : c),
                          }))}
                          className="rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
                        >
                          {condTypes.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      )}
                      {/* Value / fileType */}
                      {cond.type === "file_is_type" ? (
                        <select
                          value={cond.fileType}
                          onChange={(e) => setRuleDraft((d) => ({
                            ...d,
                            conditions: d.conditions.map((c, i) => i === idx ? { ...c, fileType: e.target.value } : c),
                          }))}
                          className="rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
                        >
                          <option value="pdf">PDF</option>
                          <option value="doc">DOC</option>
                          <option value="docx">DOCX</option>
                        </select>
                      ) : !isFileCondition || cond.type === "file_contains_keyword" ? (
                        <input
                          type="text"
                          value={cond.value}
                          onChange={(e) => setRuleDraft((d) => ({
                            ...d,
                            conditions: d.conditions.map((c, i) => i === idx ? { ...c, value: e.target.value } : c),
                          }))}
                          placeholder={cond.type === "file_contains_keyword" ? "keyword…" : "value…"}
                          className="flex-1 min-w-[120px] rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
                        />
                      ) : null}
                      {ruleDraft.conditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setRuleDraft((d) => ({ ...d, conditions: d.conditions.filter((_, i) => i !== idx) }))}
                          className="text-[var(--color-danger)] hover:text-red-700"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={!ruleDraft.name.trim() || !ruleDraft.score || saveRuleMutation.isPending}
                  onClick={() => saveRuleMutation.mutate(ruleDraft)}
                >
                  {saveRuleMutation.isPending ? "Saving…" : editingRuleId ? "Update Rule" : "Save Rule"}
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={cancelRuleForm}>Cancel</Button>
                {saveRuleMutation.isError && <p className="text-xs text-[var(--color-danger)]">Failed to save rule.</p>}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3 pb-6">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving…" : role ? "Update Template" : "Create Template"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/dashboard/templates")}>
          Cancel
        </Button>
        {saveMutation.isError && <p className="text-sm text-[var(--color-danger)]">Failed to save. Please try again.</p>}
      </div>
    </form>
  );
}
