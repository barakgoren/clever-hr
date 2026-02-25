import { apiClient } from '@/lib/api';
import type { Stage } from '@repo/shared';

export const stageService = {
  async list(roleId: number): Promise<Stage[]> {
    const { data } = await apiClient.get(`/api/roles/${roleId}/stages`);
    return data.data;
  },

  async create(
    roleId: number,
    name: string,
    order?: number,
    extras?: { color?: string; icon?: string }
  ): Promise<Stage> {
    const { data } = await apiClient.post(`/api/roles/${roleId}/stages`, { name, order, ...extras });
    return data.data;
  },

  async update(
    roleId: number,
    stageId: number,
    patch: { name?: string; order?: number; color?: string; icon?: string }
  ): Promise<Stage> {
    const { data } = await apiClient.patch(`/api/roles/${roleId}/stages/${stageId}`, patch);
    return data.data;
  },

  async delete(roleId: number, stageId: number): Promise<void> {
    await apiClient.delete(`/api/roles/${roleId}/stages/${stageId}`);
  },
};
