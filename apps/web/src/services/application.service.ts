import { apiClient } from '@/lib/api';
import type { ApplicationWithRelations } from '@repo/shared';

export const applicationService = {
  async list(params?: { roleId?: number; search?: string }): Promise<ApplicationWithRelations[]> {
    const { data } = await apiClient.get('/api/applications', { params });
    return data.data;
  },

  async getById(id: number): Promise<ApplicationWithRelations> {
    const { data } = await apiClient.get(`/api/applications/${id}`);
    return data.data;
  },

  async moveStage(id: number, stageId: number | null): Promise<ApplicationWithRelations> {
    const { data } = await apiClient.patch(`/api/applications/${id}/stage`, { stageId });
    return data.data;
  },

  async addTimeline(
    id: number,
    payload: { stageId: number; description?: string }
  ): Promise<ApplicationWithRelations> {
    const { data } = await apiClient.post(`/api/applications/${id}/timeline`, payload);
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/applications/${id}`);
  },

  async deleteMany(ids: number[]): Promise<void> {
    await apiClient.delete('/api/applications', { data: { ids } });
  },

  async getFileUrl(id: number, fieldId: string): Promise<string> {
    const { data } = await apiClient.get(`/api/applications/${id}/files/${fieldId}`);
    return data.data.url;
  },

  exportUrl(): string {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    return `${base}/api/applications/export`;
  },
};
