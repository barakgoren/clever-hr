import { apiClient } from '@/lib/api';

export const superadminsService = {
  async list() {
    const { data } = await apiClient.get('/api/superadmin/admins');
    return data.data;
  },

  async create(payload: { username: string; name: string; password: string }) {
    const { data } = await apiClient.post('/api/superadmin/admins', payload);
    return data.data;
  },
};
