import { apiClient } from '@/lib/api';
import type { Role } from '@repo/shared';
import type { CreateRoleInput, UpdateRoleInput } from '@repo/shared';

export const roleService = {
  async list(): Promise<Role[]> {
    const { data } = await apiClient.get('/api/roles');
    return data.data;
  },

  async getById(id: number): Promise<Role> {
    const { data } = await apiClient.get(`/api/roles/${id}`);
    return data.data;
  },

  async create(input: CreateRoleInput): Promise<Role> {
    const { data } = await apiClient.post('/api/roles', input);
    return data.data;
  },

  async update(id: number, input: UpdateRoleInput): Promise<Role> {
    const { data } = await apiClient.patch(`/api/roles/${id}`, input);
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/roles/${id}`);
  },

  async toggleActive(id: number, isActive: boolean): Promise<Role> {
    const { data } = await apiClient.patch(`/api/roles/${id}/active`, { isActive });
    return data.data;
  },
};
