import { z } from 'zod';

export const submitApplicationSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Valid email is required'),
  formData: z.record(z.string(), z.union([z.string(), z.boolean()])).default({}),
});

export const moveApplicationStageSchema = z.object({
  stageId: z.number().int().positive().nullable(),
});

export const addApplicationTimelineSchema = z.object({
  stageId: z.number().int().positive(),
  description: z.string().max(2000).optional().default(''),
});

export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;
export type MoveApplicationStageInput = z.infer<typeof moveApplicationStageSchema>;
export type AddApplicationTimelineInput = z.infer<typeof addApplicationTimelineSchema>;
