'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { Card, Badge, Tabs, EmptyState, Skeleton } from '@/app/components/ui';
import { OrdersIcon, ClockIcon, ChevronRightIcon } from '@/app/components/icons';
import { formatCurrency, formatRelativeTime, cn } from '@/app/lib/utils';
import type { OrderStatus, Order } from '@/app/lib/types';
import NotificationBell from '@/app/components/NotificationBell';

const statusConfig: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'error' | 'default' }> = {
  waiting: { label: 'Waiting', variant: 'warning' },
  printing: { label: 'Printing', variant: 'info' },
  ready: { label: 'Ready', variant: 'success' },
  collected: { label: 'Collected', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'error' },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<(Order & { shopAddress?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Reset page when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();

    let socket: any;
    let pollInterval: any;

    async function setupRealtime() {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        
        if (sessionData.authenticated && sessionData.user.id) {
          const studentId = sessionData.user.id;
          
          try {
            socket = io({
              reconnectionAttempts: 3,
              timeout: 5000,
            });
            
            socket.on('connect', () => {
              socket.emit('join-student', studentId);
            });

            socket.on('student-order-update', () => {
              loadOrders();
            });

            socket.on('connect_error', () => {
              if (!pollInterval) {
                pollInterval = setInterval(loadOrders, 5000);
              }
            });
          } catch (e) {
            pollInterval = setInterval(loadOrders, 5000);
          }
        }
      } catch (err) {
        console.error('Failed to set up realtime orders history:', err);
      }
    }

    setupRealtime();

    return () => {
      if (socket) socket.disconnect();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const desktopTabs = [
    { id: 'all', label: 'All', count: orders.length },
    { id: 'active', label: 'Active', count: orders.filter((o) => ['waiting', 'printing', 'ready'].includes(o.status)).length },
    { id: 'completed', label: 'Completed', count: orders.filter((o) => o.status === 'collected').length },
    { id: 'cancelled', label: 'Cancelled', count: orders.filter((o) => o.status === 'cancelled').length },
  ];

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'active') return ['waiting', 'printing', 'ready'].includes(order.status);
    if (activeTab === 'completed') return order.status === 'collected';
    if (activeTab === 'cancelled') return order.status === 'cancelled';
    return true; // "all" on desktop
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  };

  return (
    <>
      {/* ─── Mobile View ───────────────────────────────────────────────────────── */}
      <div className="md:hidden min-h-screen bg-[var(--background)] pb-28">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border-subtle)]/45 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="relative max-w-md mx-auto flex items-center justify-between px-4 h-12">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center text-[var(--text-primary)] hover:opacity-75 transition-opacity cursor-pointer focus:outline-none"
              aria-label="Back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <p className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">My Orders</p>
            <div className="flex items-center">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 py-3">
          <div className="flex bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-[20px] p-1.5 justify-between">
            {['active', 'completed', 'cancelled'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-2 rounded-[14px] text-xs font-bold transition-all capitalize',
                    isActive
                      ? 'bg-[#FDF6EC] border border-[#E9D7C3] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders List / Loading / Empty */}
        <div className="px-5 space-y-4 pt-1">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-5 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              icon={<OrdersIcon size={24} />}
              title="No orders yet"
              description="Your print orders will appear here. Start by choosing a print shop."
              action={
                <Link href="/shops">
                  <Badge variant="info" className="px-4 py-2 text-sm cursor-pointer hover:opacity-90">
                    Browse Nearby Shops
                  </Badge>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {paginatedOrders.map((order) => {
                const copies = order.items[0]?.printOptions.copies || 1;
                const printType = order.items[0]?.printOptions.color === 'color' ? 'Color' : 'B&W';
                const isCompleted = order.status === 'collected';
                const isCancelled = order.status === 'cancelled';
                const isProgress = !isCompleted && !isCancelled;

                return (
                  <div key={order.id} className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-4 text-left shadow-sm">
                    {/* Order display header */}
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-bold text-[var(--text-primary)]">Order #{order.orderId}</p>
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-0 py-0 bg-transparent text-[11px] font-bold',
                        isCompleted ? 'text-emerald-600 dark:text-emerald-400' :
                        isCancelled ? 'text-red-500 dark:text-red-400' :
                        'text-emerald-600 dark:text-emerald-400'
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', isCancelled ? 'bg-red-500' : 'bg-emerald-500')} />
                        {isCompleted ? 'Completed' : isCancelled ? 'Cancelled' : 'In Progress'}
                      </span>
                    </div>

                    {/* Shop details */}
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wide">{order.shopName}</h3>
                      <p className="text-[11px] text-[var(--text-muted)]">{order.shopAddress || 'Campus Hub'}</p>
                    </div>

                    {/* Print specs */}
                    <p className="text-[11px] text-[var(--text-secondary)] font-semibold">
                      {order.totalPages} {order.totalPages === 1 ? 'Page' : 'Pages'} &bull; {printType} &bull; {copies} {copies === 1 ? 'Copy' : 'Copies'}
                    </p>

                    {/* Timeline placement and estimation */}
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]/60 text-left">
                      <div>
                        <p className="text-[10px] text-[var(--text-muted)] font-medium">Placed on</p>
                        <p className="text-[11px] text-[var(--text-secondary)] font-semibold mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>
                      {isProgress && (
                        <div className="text-right">
                          <p className="text-[10px] text-[var(--text-muted)] font-medium">Estimated Time</p>
                          <p className="text-[11px] text-[var(--text-secondary)] font-semibold mt-0.5">~ {order.estimatedWaitMinutes} min</p>
                        </div>
                      )}
                    </div>

                    {isCancelled && order.cancellationMessage && (
                      <div className="bg-red-50 dark:bg-red-950/20 border-l-2 border-red-500 p-2.5 rounded-r-xl">
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Cancellation Reason</p>
                        <p className="text-[11px] text-[var(--text-primary)] mt-0.5 font-medium">"{order.cancellationMessage}"</p>
                      </div>
                    )}

                    {/* Action */}
                    <Link href={`/orders/${order.id}`} className="block">
                      <button className="w-full py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-hover)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all cursor-pointer">
                        View Details
                      </button>
                    </Link>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 pb-2 border-t border-[var(--border-subtle)]">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-[var(--text-muted)] font-semibold">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Desktop View ──────────────────────────────────────────────────────── */}
      <div className="hidden md:block max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1">
            My Orders
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Track and manage your print orders
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <Tabs tabs={desktopTabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Loading / Empty / List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={<OrdersIcon size={24} />}
            title="No orders yet"
            description="Your print orders will appear here. Start by choosing a print shop."
            action={
              <Link href="/shops">
                <Badge variant="info" className="px-4 py-2 text-sm cursor-pointer hover:opacity-90">
                  Browse Nearby Shops
                </Badge>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="space-y-3 stagger-children">
              {paginatedOrders.map((order) => {
                const config = statusConfig[order.status as OrderStatus] || { label: order.status, variant: 'default' };
                return (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <Card hover className="group">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{order.orderId}</p>
                            <Badge variant={config.variant} dot>
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">{order.shopName}</p>
                          {order.status === 'cancelled' && order.cancellationMessage && (
                            <p className="text-[11px] text-red-500 font-medium mt-1 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-100/50 inline-block">
                              Reason: {order.cancellationMessage}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {formatCurrency(order.totalAmount)}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {formatRelativeTime(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Files info */}
                      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                        <span>{order.items.length} {order.items.length === 1 ? 'file' : 'files'}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                        <span>{order.totalPages} pages</span>
                        {order.status !== 'collected' && order.status !== 'cancelled' && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                            <span className="flex items-center gap-1">
                              <ClockIcon size={11} />
                              Queue #{order.queueNumber}
                            </span>
                          </>
                        )}
                        <span className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                          <ChevronRightIcon size={16} />
                        </span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] animate-fade-in-up">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-xs text-[var(--text-muted)] font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
