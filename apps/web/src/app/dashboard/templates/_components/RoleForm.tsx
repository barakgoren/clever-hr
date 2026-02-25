"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Flag,
  Star,
  Check,
  Clock,
  PhoneCall,
  Mail,
  Calendar,
  MessageSquare,
  User,
  Plus,
  Trash2,
  X,
  Settings,
} from "lucide-react";
import { roleService } from "@/services/role.service";
import { stageService } from "@/services/stage.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Role,
  CustomField,
  FieldType,
  RoleType,
  Stage,
} from "@repo/shared";

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

function newField(): CustomField {
  return { id: crypto.randomUUID().slice(0, 8), label: "", type: "text" };
}

export function RoleForm({ role }: { role?: Role }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<RoleFormData>({
    name: role?.name ?? "",
    description: role?.description ?? "",
    location: role?.location ?? "",
    type: role?.type ?? "full_time",
    seniorityLevel: role?.seniorityLevel ?? "",
    requirements: role?.requirements ?? [],
    isActive: role?.isActive ?? true,
    customFields: role?.customFields ?? [],
  });

  const [requirementInput, setRequirementInput] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<keyof RoleFormData, string>>
  >({});
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#6366f1");
  const [newStageIcon, setNewStageIcon] = useState("flag");
  const [stageDrafts, setStageDrafts] = useState<
    Record<number, { name: string; color: string; icon: string }>
  >({});

  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ["stages", role?.id],
    queryFn: () => stageService.list(role!.id),
    enabled: !!role,
    initialData: role?.stages,
  });

  useEffect(() => {
    if (!stages) return;
    setStageDrafts(
      Object.fromEntries(
        stages.map((s) => [
          s.id,
          { name: s.name, color: s.color ?? "#6366f1", icon: s.icon ?? "flag" },
        ]),
      ),
    );
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
      setNewStageName("");
      setNewStageColor("#6366f1");
      setNewStageIcon("flag");
      invalidateRoleQueries();
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({
      stageId,
      patch,
    }: {
      stageId: number;
      patch: { name?: string; order?: number; color?: string; icon?: string };
    }) => stageService.update(role!.id, stageId, patch),
    onSuccess: () => invalidateRoleQueries(),
  });

  const deleteStageMutation = useMutation({
    mutationFn: (stageId: number) => stageService.delete(role!.id, stageId),
    onSuccess: () => invalidateRoleQueries(),
  });

  const reorderStages = useMutation({
    mutationFn: async ({
      from,
      to,
      snapshot,
    }: {
      from: number;
      to: number;
      snapshot: Stage[];
    }) => {
      const reordered = [...snapshot];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      await Promise.all(
        reordered.map((stage, idx) =>
          stageService.update(role!.id, stage.id, { order: idx + 1 }),
        ),
      );
    },
    onSuccess: () => invalidateRoleQueries(),
  });

  const stageBusy =
    addStageMutation.isPending ||
    updateStageMutation.isPending ||
    deleteStageMutation.isPending ||
    reorderStages.isPending;

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
      customFields: f.customFields.map((cf, i) =>
        i === idx ? { ...cf, ...patch } : cf,
      ),
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
    if (!role || !stages || to < 0 || to >= stages.length || from === to)
      return;
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
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Template Information
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Modify the template name, description, and status.
          </p>
        </div>

        <Input
          id="name"
          label="Template Name"
          placeholder="e.g. Senior Frontend Engineer"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={errors.name}
          required
        />

        <Textarea
          id="description"
          label="Description"
          placeholder="Describe the role..."
          rows={4}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />

        <Input
          id="location"
          label="Location"
          placeholder="e.g. Tel Aviv, New York, Remote"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Type
          </label>
          <Select
            value={form.type}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, type: v as RoleType }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          id="seniorityLevel"
          label="Seniority Level"
          placeholder="e.g. Junior, Mid, Senior, Intermediate"
          value={form.seniorityLevel}
          onChange={(e) =>
            setForm((f) => ({ ...f, seniorityLevel: e.target.value }))
          }
        />
      </section>

      {/* Qualifications */}
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Qualifications
          </h2>
          {form.requirements.length > 0 && (
            <Button
              type="button"
              variant="danger-ghost"
              size="sm"
              onClick={() => setForm((f) => ({ ...f, requirements: [] }))}
            >
              <X className="h-3.5 w-3.5" />
              Delete All Qualifications
            </Button>
          )}
        </div>

        {form.requirements.length > 0 && (
          <ul className="space-y-2">
            {form.requirements.map((req, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between gap-2 text-sm text-[var(--color-text-primary)]"
              >
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-600)] shrink-0" />
                  {req}
                </span>
                <button
                  type="button"
                  onClick={() => removeRequirement(idx)}
                  className="text-[var(--color-danger)] hover:text-red-700 transition-colors shrink-0"
                >
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={addRequirements}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-2.5 pt-2">
          <Switch
            checked={form.isActive}
            onCheckedChange={(checked) =>
              setForm((f) => ({ ...f, isActive: checked }))
            }
          />
          <label className="text-sm font-medium text-[var(--color-text-primary)]">
            Active Template
          </label>
        </div>
      </section>

      {/* Form Fields */}
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Form Fields
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Define the fields that will appear in your application form
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addField}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Field
          </Button>
        </div>

        {form.customFields.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
            No custom fields yet. Add fields to customize your application form.
          </p>
        ) : (
          <div className="space-y-2">
            {form.customFields.map((field, idx) => (
              <div
                key={field.id}
                className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2"
              >
                <input
                  type="text"
                  value={field.id}
                  onChange={(e) => updateField(idx, { id: e.target.value })}
                  placeholder="field_id"
                  className="w-40 rounded border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
                />
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(idx, { label: e.target.value })}
                  placeholder="Display Label"
                  className="flex-1 rounded border border-[var(--color-border)] bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
                />
                <Select
                  value={field.type}
                  onValueChange={(v) =>
                    updateField(idx, { type: v as FieldType })
                  }
                >
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
                <button
                  type="button"
                  onClick={() => removeField(idx)}
                  className="text-[var(--color-danger)] hover:text-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pipeline Stages */}
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Pipeline Stages
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Organize how candidates move through this template.
            </p>
          </div>
          {role ? (
            <div className="flex items-center gap-2 w-[320px] max-w-full">
              <input
                type="text"
                value={newStageName}
                placeholder="Add a new stage"
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddStage();
                  }
                }}
                className="flex-1 rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
              />
              <Button
                type="button"
                size="sm"
                disabled={!newStageName.trim() || stageBusy}
                onClick={handleAddStage}
              >
                Add Stage
              </Button>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">
              Save the template first to configure stages.
            </p>
          )}
        </div>

        {!role ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Create and save the template to start defining its pipeline.
          </p>
        ) : stagesLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-11 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] animate-pulse"
              />
            ))}
          </div>
        ) : stages.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            No stages yet. Add a stage to define the pipeline.
          </p>
        ) : (
          <div className="space-y-2">
            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 py-2"
              >
                <span className="w-10 text-xs font-semibold text-[var(--color-text-muted)]">
                  #{idx + 1}
                </span>
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
                    value={
                      stageDrafts[stage.id]?.color ?? stage.color ?? "#6366f1"
                    }
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={idx === 0 || stageBusy}
                    onClick={() => handleReorder(idx, idx - 1)}
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={idx === stages.length - 1 || stageBusy}
                    onClick={() => handleReorder(idx, idx + 1)}
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={stageBusy}
                    onClick={() => handleRenameStage(stage.id)}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]"
                    disabled={stageBusy}
                    onClick={() => handleDeleteStage(stage.id)}
                    title="Delete stage"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Submit */}
      <div className="flex items-center gap-3 pb-6">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending
            ? "Saving…"
            : role
              ? "Update Template"
              : "Create Template"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/dashboard/templates")}
        >
          Cancel
        </Button>
        {saveMutation.isError && (
          <p className="text-sm text-[var(--color-danger)]">
            Failed to save. Please try again.
          </p>
        )}
      </div>
    </form>
  );
}
