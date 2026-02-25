import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { CreateRoleInput, UpdateRoleInput, CustomField } from "@repo/shared";

const ROLE_COLORS = [
  "#0ea5e9",
  "#0891b2",
  "#0f766e",
  "#10b981",
  "#22c55e",
  "#65a30d",
  "#84cc16",
  "#a3e635",
  "#eab308",
  "#ca8a04",
  "#f59e0b",
  "#f97316",
  "#fb923c",
  "#f43f5e",
  "#e11d48",
  "#ec4899",
  "#db2777",
  "#c084fc",
  "#8b5cf6",
  "#7c3aed",
  "#6366f1",
  "#4f46e5",
  "#4338ca",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#06b6d4",
  "#14b8a6",
  "#38bdf8",
  "#0f172a",
  "#475569",
  "#94a3b8",
  "#a8a29e",
  "#d6d3d1",
  "#f4f4f5",
  "#f9a8d4",
  "#fb7185",
];

function pickRoleColor(): string {
  return ROLE_COLORS[Math.floor(Math.random() * ROLE_COLORS.length)];
}

const SYSTEM_FIELDS: CustomField[] = [
  {
    id: "full_name",
    label: "Full Name",
    type: "text",
    required: true,
    system: true,
  },
  { id: "email", label: "Email", type: "email", required: true, system: true },
];

const DEFAULT_STAGES = [
  { name: "Pending", order: 1, color: "#f97316", icon: "clock" },
  { name: "Accepted", order: 2, color: "#22c55e", icon: "check" },
  { name: "Rejected", order: 3, color: "#f43f5e", icon: "flag" },
];

async function createDefaultStages(roleId: number) {
  await prisma.stage.createMany({
    data: DEFAULT_STAGES.map((s) => ({ ...s, roleId })),
  });
}

function ensureSystemFields(customFields: CustomField[]): CustomField[] {
  const submittedById = new Map(customFields.map((f) => [f.id, f]));
  // Preserve label edits made by the user; always keep system: true and required: true
  const systemFields = SYSTEM_FIELDS.map((def) => {
    const submitted = submittedById.get(def.id);
    return submitted ? { ...def, label: submitted.label } : def;
  });
  const nonSystemFields = customFields.filter(
    (f) => !SYSTEM_FIELDS.some((s) => s.id === f.id),
  );
  return [...systemFields, ...nonSystemFields];
}

export const roleService = {
  async list(companyId: number) {
    return prisma.role.findMany({
      where: { companyId },
      include: { stages: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: number, companyId: number) {
    const role = await prisma.role.findFirst({
      where: { id, companyId },
      include: { stages: { orderBy: { order: "asc" } } },
    });
    if (!role) throw new AppError(404, "Role not found");
    return role;
  },

  async create(companyId: number, userId: number, data: CreateRoleInput) {
    const customFields = ensureSystemFields(data.customFields as CustomField[]);
    const role = await prisma.role.create({
      data: {
        companyId,
        createdByUserId: userId,
        name: data.name,
        color: pickRoleColor(),
        description: data.description ?? null,
        location: data.location ?? null,
        type: data.type,
        seniorityLevel: data.seniorityLevel ?? null,
        requirements: data.requirements,
        customFields: customFields as object[],
      },
      include: { stages: true },
    });
    await createDefaultStages(role.id);
    return this.getById(role.id, companyId);
  },

  async update(id: number, companyId: number, data: UpdateRoleInput) {
    await this.getById(id, companyId);
    const customFields = data.customFields
      ? ensureSystemFields(data.customFields as CustomField[])
      : undefined;
    return prisma.role.update({
      where: { id },
      data: {
        ...data,
        customFields: customFields ? (customFields as object[]) : undefined,
      },
      include: { stages: { orderBy: { order: "asc" } } },
    });
  },

  async delete(id: number, companyId: number) {
    await this.getById(id, companyId);
    const appCount = await prisma.application.count({ where: { roleId: id } });
    if (appCount > 0)
      throw new AppError(
        400,
        `Cannot delete role with ${appCount} existing application(s). Deactivate it instead.`,
      );
    await prisma.role.delete({ where: { id } });
  },

  async toggleActive(id: number, companyId: number, isActive: boolean) {
    await this.getById(id, companyId);
    return prisma.role.update({ where: { id }, data: { isActive } });
  },
};
