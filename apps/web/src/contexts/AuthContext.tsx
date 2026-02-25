'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '@/services/auth.service';
import type { User } from '@repo/shared';

interface AuthUser extends Pick<User, 'id' | 'name' | 'email' | 'role' | 'companyId'> {}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to restore session via refresh token cookie
  useEffect(() => {
    authService
      .refresh()
      .then((token) => {
        if (token) {
          // Decode user from the new token's payload would require jwt-decode;
          // instead, we fetch /api/company to confirm auth, and store minimal
          // user info. For simplicity, call a lightweight /api/users endpoint.
          // Here we just mark as "needs profile fetch" — handled in dashboard layout.
          // We store the fact that we ARE authed via a local state flag.
          setUser({ id: 0, name: '', email: '', role: 'user', companyId: 0 }); // placeholder
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setUser(result.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
