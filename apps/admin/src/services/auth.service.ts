import { apiClient, setAccessToken, clearAccessToken } from '@/lib/api';
import type { SuperAdminUser } from '@/contexts/AuthContext';

interface AuthResponse {
  accessToken: string;
  superAdmin: SuperAdminUser;
}

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const { data } = await apiClient.post('/api/superadmin/auth/login', { username, password });
    setAccessToken(data.data.accessToken);
    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/superadmin/auth/logout');
    clearAccessToken();
  },

  async refresh(): Promise<AuthResponse | null> {
    try {
      const { data } = await apiClient.post('/api/superadmin/auth/refresh');
      setAccessToken(data.data.accessToken);
      return data.data;
    } catch {
      clearAccessToken();
      return null;
    }
  },
};
