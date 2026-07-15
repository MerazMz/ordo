'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/app/lib/store';
import { Avatar, Button } from '@/app/components/ui';
import {
  PrinterIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  OrdersIcon,
  ShopIcon,
  LogOutIcon,
} from '@/app/components/icons';

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    async function getSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      } catch (e) {
        console.error('Failed to load session:', e);
      }
    }
    getSession();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const navLinks = [
    { href: '/shops', label: 'Shops', icon: <ShopIcon size={18} /> },
    { href: '/orders', label: 'My Orders', icon: <OrdersIcon size={18} /> },
  ];

  if (pathname === '/login') {
    return <div className="min-h-screen bg-[var(--background)]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <PrinterIcon size={14} className="text-[var(--text-inverse)]" />
            </div>
            <span className="text-base font-bold text-[var(--text-primary)] tracking-tight">Ordo</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${pathname.startsWith(link.href)
                    ? 'bg-[var(--accent-subtle)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
            </button>

            <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
              <BellIcon size={16} />
            </button>

            <div className="w-px h-5 bg-[var(--border)] mx-1" />

            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Avatar name={user.name} size="sm" />
                  <span className="hidden md:block text-sm font-medium text-[var(--text-primary)]">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--error-bg)] hover:text-[var(--error)] transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOutIcon size={16} />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
