import { z } from 'zod';

export const updateCompanySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .optional(),
  description: z.string().max(500).nullable().optional(),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
