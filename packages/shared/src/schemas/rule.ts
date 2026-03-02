import { z } from 'zod';

const conditionTypeSchema = z.enum([
  'field_equals',
  'field_contains',
  'file_is_type',
  'file_contains_keyword',
]);

const fileTypeSchema = z.enum(['pdf', 'doc', 'docx']);

const ruleConditionSchema = z.object({
  type: conditionTypeSchema,
  fieldId: z.string().min(1),
  value: z.string().optional(),
  fileType: fileTypeSchema.optional(),
});

export const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  score: z.number().int().positive(),
  conditions: z.array(ruleConditionSchema).min(1),
});

export const updateRuleSchema = createRuleSchema.partial();

export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
