import { apiClient, setAccessToken, clearAccessToken } from '@/lib/api';
import type { User } from '@repo/shared';

type AuthUser = Pick<User, 'id' | 'name' | 'email' | 'role' | 'companyId'>;

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

interface RefreshResponse {
  accessToken: string;
  user: AuthUser;
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

  async refresh(): Promise<RefreshResponse | null> {
    try {
      const { data } = await apiClient.post('/api/auth/refresh');
      setAccessToken(data.data.accessToken);
      return data.data;
    } catch {
      clearAccessToken();
      return null;
    }
  },
};
