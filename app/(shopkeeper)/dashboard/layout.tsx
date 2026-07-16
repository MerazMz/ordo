'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/app/lib/store';
import { Avatar, Badge } from '@/app/components/ui';
import NotificationBell from '@/app/components/NotificationBell';
import {
  PrinterIcon,
  DashboardIcon,
  OrdersIcon,
  QueueIcon,
  CompletedIcon,
  UsersIcon,
  AnalyticsIcon,
  SettingsIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  MenuIcon,
  XIcon,
  LogOutIcon,
} from '@/app/components/icons';
import { cn } from '@/app/lib/utils';

const sidebarLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/dashboard/orders', label: 'Orders', icon: OrdersIcon },
  { href: '/dashboard/queue', label: 'Queue', icon: QueueIcon },
  { href: '/dashboard/completed', label: 'Completed', icon: CompletedIcon },
  { href: '/dashboard/customers', label: 'Customers', icon: UsersIcon },
  { href: '/dashboard/analytics', label: 'Analytics', icon: AnalyticsIcon },
  { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
];

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  shopId?: string;
}

export default function ShopkeeperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [shopName, setShopName] = useState('My Shop');

  useEffect(() => {
    async function getSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          
          if (data.user.shopId) {
            const shopRes = await fetch(`/api/shops/${data.user.shopId}`);
            const shopData = await shopRes.json();
            if (shopData.success) {
              setShopName(shopData.data.name);
            }
          }
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

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-60 bg-[var(--surface)] border-r border-[var(--border-subtle)]',
          'flex flex-col transition-transform duration-300 ease-[var(--ease-default)]',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-[var(--border-subtle)]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <PrinterIcon size={14} className="text-[var(--text-inverse)]" />
            </div>
            <span className="text-base font-bold text-[var(--text-primary)] tracking-tight">Ordo</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Shop Info */}
        <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{shopName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
            <span className="text-xs text-[var(--text-muted)]">Open</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-[var(--accent-subtle)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                )}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-[var(--border-subtle)] space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
          >
            {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
          >
            <LogOutIcon size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-[var(--background)] border-b border-[var(--border-subtle)] px-6 flex items-center justify-between glass">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
          >
            <MenuIcon size={18} />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="w-px h-5 bg-[var(--border)] mx-1" />
            <div className="flex items-center gap-2">
              {user && (
                <>
                  <Avatar name={user.name} size="sm" />
                  <span className="hidden md:block text-sm font-medium text-[var(--text-primary)]">
                    {user.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
