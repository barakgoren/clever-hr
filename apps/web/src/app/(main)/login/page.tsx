'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Eye, EyeOff, Users, Zap, Shield, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const features = [
  { icon: Users, text: 'Track every application in real-time' },
  { icon: Zap, text: 'AI-powered candidate comparison' },
  { icon: Shield, text: 'Customizable hiring pipelines' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex">
      {/* Left: Branded panel */}
      <div className="hidden lg:flex lg:w-[42%] bg-[var(--color-brand-600)] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute top-20 right-20 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative z-10 max-w-sm w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 border border-white/20 backdrop-blur-sm">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Claver HR</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Streamline your<br />hiring process
          </h1>
          <p className="text-white/70 text-base mb-10 leading-relaxed">
            Manage applications, evaluate candidates, and make faster hiring decisions — all in one place.
          </p>

          <div className="space-y-3.5">
            {features.map(({ text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 border border-white/20 shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-white/85 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[380px] space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-600)]">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Claver HR</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
              Sign in to continue to your dashboard
            </p>
          </div>

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

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-[var(--color-text-secondary)]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-9 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-white px-3 pr-10 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:ring-offset-0 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

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
