'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Avatar, Skeleton } from '@/app/components/ui';
import { useTheme } from '@/app/lib/store';
import {
  SunIcon,
  MoonIcon,
  OrdersIcon,
  LogOutIcon,
} from '@/app/components/icons';
import { formatCurrency } from '@/app/lib/utils';

interface StudentProfile {
  name: string;
  email: string;
  phone: string;
  college: string;
  totalOrders: number;
  totalSpent: number;
}

export default function StudentProfilePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/student/profile');
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
        } else {
          router.push('/login');
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto px-6 py-6 pb-24 space-y-6 animate-fade-in">
      {/* Header Info */}
      <Card className="text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--border-strong)]" />
        <div className="mt-4 mb-3 flex justify-center">
          <Avatar name={profile.name} size="lg" />
        </div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{profile.name}</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{profile.email}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium px-2 py-0.5 inline-block bg-[var(--surface-hover)] rounded-full">
          🎓 {profile.college || 'College Campus'}
        </p>
      </Card>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center p-4">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center mx-auto mb-2 text-[var(--text-secondary)]">
            <OrdersIcon size={16} />
          </div>
          <span className="text-2xl font-bold text-[var(--text-primary)] block">
            {profile.totalOrders}
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-muted)]">
            Orders Placed
          </span>
        </Card>
        <Card className="text-center p-4">
          <div className="w-8 h-8 rounded-xl bg-[var(--success-bg)] flex items-center justify-center mx-auto mb-2 text-[var(--success)]">
            <span>₹</span>
          </div>
          <span className="text-2xl font-bold text-[var(--text-primary)] block">
            {formatCurrency(profile.totalSpent)}
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-muted)]">
            Total Spent
          </span>
        </Card>
      </div>

      {/* Account Preferences Card */}
      <Card>
        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3.5 text-left">
          Preferences
        </h3>
        <div className="flex items-center justify-between py-1">
          <div className="text-left">
            <p className="text-sm font-medium text-[var(--text-primary)]">Display Theme</p>
            <p className="text-xs text-[var(--text-muted)]">Switch between light and dark display modes</p>
          </div>
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
          </button>
        </div>
      </Card>

      {/* Details Card */}
      <Card className="text-left">
        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3.5">
          Student Information
        </h3>
        <div className="space-y-3.5 text-sm">
          <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2.5">
            <span className="text-[var(--text-secondary)] font-medium">Phone Number</span>
            <span className="text-[var(--text-primary)] font-semibold">{profile.phone || 'Not added'}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="text-[var(--text-secondary)] font-medium">Institution</span>
            <span className="text-[var(--text-primary)] font-semibold">{profile.college || 'N/A'}</span>
          </div>
        </div>
      </Card>

      {/* Log Out CTA */}
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        onClick={handleLogout}
        className="hover:bg-[var(--error-bg)] hover:text-[var(--error)] hover:border-[var(--error)] border border-[var(--border)]"
      >
        <LogOutIcon size={16} />
        <span>Sign Out Account</span>
      </Button>
    </div>
  );
}
