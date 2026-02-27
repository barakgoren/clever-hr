import { z } from 'zod';

export const createSuperAdminSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
});

export const superAdminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type CreateSuperAdminInput = z.infer<typeof createSuperAdminSchema>;
