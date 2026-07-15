'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { Card, Badge, Tabs, EmptyState, Skeleton } from '@/app/components/ui';
import { OrdersIcon, ClockIcon, ChevronRightIcon } from '@/app/components/icons';
import { formatCurrency, formatRelativeTime } from '@/app/lib/utils';
import type { OrderStatus, Order } from '@/app/lib/types';

const statusConfig: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'error' | 'default' }> = {
  waiting: { label: 'Waiting', variant: 'warning' },
  printing: { label: 'Printing', variant: 'info' },
  ready: { label: 'Ready', variant: 'success' },
  collected: { label: 'Collected', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'error' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
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
              // Hot-reload order list in real time
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

  const tabs = [
    { id: 'all', label: 'All', count: orders.length },
    { id: 'active', label: 'Active', count: orders.filter((o) => ['waiting', 'printing', 'ready'].includes(o.status)).length },
    { id: 'completed', label: 'Completed', count: orders.filter((o) => o.status === 'collected').length },
  ];

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'active') return ['waiting', 'printing', 'ready'].includes(order.status);
    if (activeTab === 'completed') return order.status === 'collected';
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
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
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Loading Skeleton */}
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

                    {/* Files */}
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
  );
}
