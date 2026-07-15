'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/app/lib/store';
import { Avatar } from '@/app/components/ui';
import {
  PrinterIcon,
  DashboardIcon,
  ShopIcon,
  UsersIcon,
  OrdersIcon,
  PaymentIcon,
  AnalyticsIcon,
  SettingsIcon,
  SupportIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  MenuIcon,
  XIcon,
  LogOutIcon,
} from '@/app/components/icons';
import { cn } from '@/app/lib/utils';

const sidebarLinks = [
  { href: '/admin', label: 'Overview', icon: DashboardIcon },
  { href: '/admin/shops', label: 'Shops', icon: ShopIcon },
  { href: '/admin/students', label: 'Students', icon: UsersIcon },
  { href: '/admin/orders', label: 'Orders', icon: OrdersIcon },
  { href: '/admin/payments', label: 'Payments', icon: PaymentIcon },
  { href: '/admin/analytics', label: 'Analytics', icon: AnalyticsIcon },
  { href: '/admin/settings', label: 'Settings', icon: SettingsIcon },
  { href: '/admin/support', label: 'Support', icon: SupportIcon },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
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
        <div className="h-14 px-5 flex items-center justify-between border-b border-[var(--border-subtle)]">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <PrinterIcon size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-[var(--text-primary)] tracking-tight">Ordo</span>
            <div className="px-1.5 py-0.5 rounded-md bg-[var(--accent-subtle)] text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider">
              Admin
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer">
            <XIcon size={16} />
          </button>
        </div>

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

        <div className="px-3 py-3 border-t border-[var(--border-subtle)] space-y-1">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer">
            {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer text-left"
          >
            <LogOutIcon size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 bg-[var(--background)] border-b border-[var(--border-subtle)] px-6 flex items-center justify-between glass">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer">
            <MenuIcon size={18} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
              <BellIcon size={16} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--error)] text-white text-[10px] font-medium flex items-center justify-center">3</span>
            </button>
            <div className="w-px h-5 bg-[var(--border)] mx-1" />
            <Avatar name="Admin User" size="sm" />
            <span className="hidden md:block text-sm font-medium text-[var(--text-primary)]">Admin</span>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
