import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send httpOnly refresh token cookie
});

// Attach access token from memory on every request
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try to refresh once, then redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(original);
      } catch {
        clearAccessToken();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          // window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── In-memory token store ──────────────────────────────────────────────────
let _accessToken: string | null = null;

export function setAccessToken(token: string) { _accessToken = token; }
export function getAccessToken(): string | null { return _accessToken; }
export function clearAccessToken() { _accessToken = null; }
