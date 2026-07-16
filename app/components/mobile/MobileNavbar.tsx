'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { OrdersIcon } from '@/app/components/icons';

// Custom icons matching the user's reference image
function HomeIcon({ size = 20, className = '', active = false }: { size?: number; className?: string; active?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function UploadTabIcon({ size = 20, className = '', active = false }: { size?: number; className?: string; active?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <polyline points="9 15 12 12 15 15" />
    </svg>
  );
}

function ProfileIcon({ size = 20, className = '', active = false }: { size?: number; className?: string; active?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? "1" : "1.8"}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function MobileNavbar() {
  const pathname = usePathname();

  // Hide bottom navbar on login page
  if (pathname === '/login') {
    return null;
  }

  const navItems = [
    {
      label: 'Home',
      href: '/shops',
      icon: (active: boolean) => <HomeIcon size={20} active={active} />,
      isActive: pathname.startsWith('/shops'),
    },
    {
      label: 'Orders',
      href: '/orders',
      icon: (active: boolean) => <OrdersIcon size={18} className={cn(active && "fill-currentColor")} />,
      isActive: pathname.startsWith('/orders'),
    },
    {
      label: 'Upload',
      href: '/upload',
      icon: (active: boolean) => <UploadTabIcon size={20} active={active} />,
      isActive: pathname.startsWith('/upload'),
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: (active: boolean) => <ProfileIcon size={20} active={active} />,
      isActive: pathname.startsWith('/profile'),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)] border-t border-[var(--border-subtle)] pb-safe-bottom shadow-lg">
      <nav className="max-w-md mx-auto h-16 flex items-center justify-around px-4">
        {navItems.map((item) => {
          const active = item.isActive;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 text-[10px] font-semibold transition-all duration-150 cursor-pointer focus:outline-none",
                active
                  ? "text-[var(--accent)] scale-105"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              <div className={cn(
                "w-5 h-5 flex items-center justify-center mb-1 transition-transform",
                active && "transform -translate-y-0.5"
              )}>
                {item.icon(active)}
              </div>
              <span className="tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
