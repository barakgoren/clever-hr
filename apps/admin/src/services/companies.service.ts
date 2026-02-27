import { apiClient } from '@/lib/api';

export const companiesService = {
  async list() {
    const { data } = await apiClient.get('/api/superadmin/companies');
    return data.data;
  },

  async get(id: number) {
    const { data } = await apiClient.get(`/api/superadmin/companies/${id}`);
    return data.data;
  },

  async create(payload: { company: { name: string; slug: string; description?: string }; user: { name: string; username: string; email: string; password: string; role?: string } }) {
    const { data } = await apiClient.post('/api/superadmin/companies', payload);
    return data.data;
  },

  async update(id: number, payload: { name?: string; slug?: string; description?: string }) {
    const { data } = await apiClient.patch(`/api/superadmin/companies/${id}`, payload);
    return data.data;
  },

  async updatePlan(id: number, plan: 'team' | 'ultimate') {
    const { data } = await apiClient.patch(`/api/superadmin/companies/${id}/plan`, { plan });
    return data.data;
  },

  async getUsers(companyId: number) {
    const { data } = await apiClient.get(`/api/superadmin/companies/${companyId}/users`);
    return data.data;
  },

  async createUser(companyId: number, payload: { name: string; username: string; email: string; password: string; role?: string }) {
    const { data } = await apiClient.post(`/api/superadmin/companies/${companyId}/users`, payload);
    return data.data;
  },

  async deleteUser(companyId: number, userId: number) {
    await apiClient.delete(`/api/superadmin/companies/${companyId}/users/${userId}`);
  },

  async delete(id: number) {
    await apiClient.delete(`/api/superadmin/companies/${id}`);
  },
};
