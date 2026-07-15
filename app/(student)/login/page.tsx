'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card } from '@/app/components/ui';
import { PhoneIcon, ArrowRightIcon, PrinterIcon } from '@/app/components/icons';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { name, email, password, phone, college }
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Success - Redirect based on role
      const user = data.user;
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'shopkeeper') {
        router.push('/dashboard');
      } else if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push('/shops');
      }
      
      // Force page refresh to update proxy state and layout context
      setTimeout(() => {
        router.refresh();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex flex-1 bg-[var(--accent)] p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/5" />

        <div className="relative">
          <Link href="/" className="flex items-center gap-2 mb-20">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <PrinterIcon size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Ordo</span>
          </Link>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Upload. Pay.<br />Collect.
          </h1>
          <p className="text-base text-white/60 max-w-sm leading-relaxed">
            The modern way to manage print orders in college. Skip the queue, save your time.
          </p>
        </div>

        <div className="relative flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-white/40">
            <span>Campus Print Management</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Real-time Queues</span>
          </div>
          <Link href="/" className="text-white/60 hover:text-white transition-colors flex items-center gap-1.5 font-medium">
            ← Visit Homepage
          </Link>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <PrinterIcon size={16} className="text-[var(--text-inverse)]" />
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Ordo</span>
          </div>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1">
            {isRegister ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            {isRegister 
              ? 'Student registration portal' 
              : 'Sign in to access your dashboard'
            }
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-[var(--error-bg)] border border-[var(--error-border)] text-xs text-[var(--error)]">
                {error}
              </div>
            )}

            {isRegister && (
              <>
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  icon={<PhoneIcon size={16} />}
                  required
                />
                <Input
                  label="College Name"
                  type="text"
                  placeholder="VIT University (Optional)"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                />
              </>
            )}

            <Input
              label="Email address"
              type="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button size="lg" fullWidth loading={loading} type="submit">
              {isRegister ? 'Register' : 'Sign in'}
              <ArrowRightIcon size={16} />
            </Button>
          </form>

          {/* View Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              {isRegister 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up (Students only)"
              }
            </button>
          </div>

          <p className="text-xs text-[var(--text-muted)] text-center mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
