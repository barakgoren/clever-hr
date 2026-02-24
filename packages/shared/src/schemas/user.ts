import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Username must be lowercase letters, numbers, and underscores only'),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user']).default('user'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'user']).optional(),
  password: z.string().min(8).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
