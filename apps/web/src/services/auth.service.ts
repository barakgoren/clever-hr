import { apiClient, setAccessToken, clearAccessToken } from '@/lib/api';
import type { User } from '@repo/shared';

interface LoginResponse {
  accessToken: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'companyId'>;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post('/api/auth/login', { email, password });
    setAccessToken(data.data.accessToken);
    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
    clearAccessToken();
  },

  async refresh(): Promise<string | null> {
    try {
      const { data } = await apiClient.post('/api/auth/refresh');
      setAccessToken(data.data.accessToken);
      return data.data.accessToken;
    } catch {
      clearAccessToken();
      return null;
    }
  },
};
