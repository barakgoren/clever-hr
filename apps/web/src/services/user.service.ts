import { apiClient } from '@/lib/api';
import type { User } from '@repo/shared';
import type { CreateUserInput, UpdateUserInput } from '@repo/shared';

export const userService = {
  async list(): Promise<User[]> {
    const { data } = await apiClient.get('/api/users');
    return data.data;
  },

  async create(input: CreateUserInput): Promise<User> {
    const { data } = await apiClient.post('/api/users', input);
    return data.data;
  },

  async update(id: number, input: UpdateUserInput): Promise<User> {
    const { data } = await apiClient.patch(`/api/users/${id}`, input);
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/users/${id}`);
  },
};
