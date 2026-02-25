import { z } from 'zod';

const fieldTypeSchema = z.enum([
  'text',
  'textarea',
  'email',
  'tel',
  'url',
  'file',
  'checkbox',
  'select',
]);

const customFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: fieldTypeSchema,
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  system: z.boolean().optional(),
});

const roleTypeSchema = z.enum(['full_time', 'part_time', 'hybrid', 'remote']);

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  type: roleTypeSchema,
  seniorityLevel: z.string().max(50).nullable().optional(),
  requirements: z.array(z.string()).default([]),
  customFields: z.array(customFieldSchema).default([]),
});

export const updateRoleSchema = createRoleSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
