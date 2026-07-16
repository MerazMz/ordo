'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNotifications } from '@/app/lib/store';
import { BellIcon } from '@/app/components/icons';
import { cn } from '@/app/lib/utils';

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationBell() {
  const { notifications, addNotification, markAsRead, clearNotifications, unreadCount } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch session
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      } catch (e) {
        console.error('Notification session check failed:', e);
      }
    }
    loadSession();
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!user) return;
    
    const socket = io();
    
    socket.on('connect', () => {
      if (user.role === 'student') {
        socket.emit('join-student', user.id);
      } else if (user.role === 'shopkeeper' && user.shopId) {
        socket.emit('join-shop', user.shopId);
      }
    });
    
    socket.on('student-order-update', (data: any) => {
      addNotification({
        title: 'Order Status Update',
        message: data?.message || 'Your print order status has been updated.',
        type: data?.status === 'ready' ? 'success' : 'info'
      });
    });
    
    socket.on('queue-update', (data: any) => {
      if (user.role === 'shopkeeper' && data?.message) {
        addNotification({
          title: 'Queue Update',
          message: data.message,
          type: 'success'
        });
      }
    });
    
    return () => {
      socket.disconnect();
    };
  }, [user, addNotification]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setShowDropdown(!showDropdown);
    // Mark all as read when opening the dropdown
    if (!showDropdown && notifications.length > 0) {
      notifications.forEach((n) => {
        if (!n.read) markAsRead(n.id);
      });
    }
  };

  // Only display the last 5 notifications in the UI feed
  const displayList = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className={cn(
          "relative w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer focus:outline-none",
          showDropdown && "bg-[var(--surface-hover)] text-[var(--text-primary)]"
        )}
        aria-label="Notifications"
      >
        <BellIcon size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--error)] rounded-full animate-pulse" />
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl z-50 overflow-hidden animate-fade-in text-left">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-hover)]">
            <span className="text-xs font-semibold text-[var(--text-primary)] tracking-wide uppercase">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="text-[11px] font-medium text-[var(--error)] hover:underline cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-subtle)]">
            {displayList.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">
                No new notifications
              </div>
            ) : (
              displayList.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3.5 flex gap-3 transition-colors hover:bg-[var(--surface-hover)]",
                    !notification.read && "bg-[var(--accent-subtle)]/40"
                  )}
                >
                  {/* Icon Indicator */}
                  <div className="flex-shrink-0 mt-0.5">
                    {notification.type === 'success' ? (
                      <div className="w-5 h-5 rounded-full bg-[var(--success-bg)] flex items-center justify-center text-[var(--success)]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    ) : notification.type === 'error' ? (
                      <div className="w-5 h-5 rounded-full bg-[var(--error-bg)] flex items-center justify-center text-[var(--error)]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[var(--info-bg)] flex items-center justify-center text-[var(--info)]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Message body */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{notification.title}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{notification.message}</p>
                    <span className="text-[10px] text-[var(--text-muted)] mt-1.5 block">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer (Total notifications count) */}
          {notifications.length > 5 && (
            <div className="px-4 py-2 text-center border-t border-[var(--border-subtle)] bg-[var(--surface-hover)]">
              <span className="text-[10px] text-[var(--text-muted)]">
                Showing last 5 of {notifications.length} notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
