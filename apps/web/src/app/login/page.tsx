'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Metadata } from 'next';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-subtle)] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-600)] shadow-md">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Claver HR</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Sign in to your account</p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="rounded-[var(--radius)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
