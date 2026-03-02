import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { RuleCondition, RuleMatchResult } from "@repo/shared";

type ApplicationForEval = {
  resumeS3Key: string | null;
  formData: Record<string, string | boolean>;
  extractedTexts: Record<string, string>;
};

function getFileExtension(s3Key: string | null): string {
  if (!s3Key) return "";
  const last = s3Key.split("/").pop() ?? "";
  const dot = last.lastIndexOf(".");
  return dot >= 0 ? last.slice(dot + 1).toLowerCase() : "";
}

function evaluateCondition(condition: RuleCondition, application: ApplicationForEval): boolean {
  const { type, fieldId, value, fileType } = condition;

  switch (type) {
    case "field_equals": {
      if (value === undefined) return false;
      const fieldVal = String(application.formData[fieldId] ?? "");
      return fieldVal.toLowerCase() === value.toLowerCase();
    }
    case "field_contains": {
      if (value === undefined) return false;
      const fieldVal = String(application.formData[fieldId] ?? "");
      return fieldVal.toLowerCase().includes(value.toLowerCase());
    }
    case "file_is_type": {
      if (!fileType) return false;
      // Use resumeS3Key for the resume field; for other fields fall through
      const ext = fieldId === "resume" ? getFileExtension(application.resumeS3Key) : getFileExtension(application.resumeS3Key); // generalise later
      return ext === fileType.toLowerCase();
    }
    case "file_contains_keyword": {
      if (value === undefined) return false;
      const text = application.extractedTexts[fieldId] ?? "";
      return text.toLowerCase().includes(value.toLowerCase());
    }
    default:
      return false;
  }
}

export const ruleService = {
  async list(roleId: number, companyId: number) {
    return prisma.rule.findMany({ where: { roleId, companyId }, orderBy: { createdAt: "asc" } });
  },

  async create(roleId: number, companyId: number, data: { name: string; score: number; conditions: RuleCondition[] }) {
    // Verify role belongs to company
    const role = await prisma.role.findFirst({ where: { id: roleId, companyId } });
    if (!role) throw new AppError(404, "Role not found");
    return prisma.rule.create({ data: { roleId, companyId, name: data.name, score: data.score, conditions: data.conditions as object[] } });
  },

  async update(id: number, companyId: number, data: Partial<{ name: string; score: number; conditions: RuleCondition[] }>) {
    const rule = await prisma.rule.findFirst({ where: { id, companyId } });
    if (!rule) throw new AppError(404, "Rule not found");
    return prisma.rule.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.score !== undefined && { score: data.score }),
        ...(data.conditions !== undefined && { conditions: data.conditions as object[] }),
      },
    });
  },

  async delete(id: number, companyId: number) {
    const rule = await prisma.rule.findFirst({ where: { id, companyId } });
    if (!rule) throw new AppError(404, "Rule not found");
    await prisma.rule.delete({ where: { id } });
  },

  evaluateRulesForApplication(application: ApplicationForEval, rules: Array<{ id: number; name: string; score: number; conditions: unknown }>): { totalScore: number; breakdown: RuleMatchResult[] } {
    const breakdown: RuleMatchResult[] = rules.map((rule) => {
      const conditions = rule.conditions as RuleCondition[];
      const matched = conditions.length > 0 && conditions.every((c) => evaluateCondition(c, application));
      return { ruleId: rule.id, ruleName: rule.name, score: matched ? rule.score : 0, matched };
    });
    const totalScore = breakdown.reduce((sum, r) => sum + r.score, 0);
    return { totalScore, breakdown };
  },
};
