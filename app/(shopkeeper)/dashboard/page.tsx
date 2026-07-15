'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { Card, StatCard, Badge, Skeleton, EmptyState, Button } from '@/app/components/ui';
import {
  OrdersIcon,
  ClockIcon,
  PaymentIcon,
  QueueIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  QRIcon,
} from '@/app/components/icons';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/app/lib/utils';
import type { Order, Shop } from '@/app/lib/types';
import ShopQRModal from '@/app/components/ShopQRModal';

export default function ShopkeeperDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    async function loadDashboardData(silent = false) {
      if (!silent) setLoading(true);
      try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        if (!silent) setLoading(false);
      }
    }

    async function loadShopDetails() {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated && sessionData.user.shopId) {
          const shopId = sessionData.user.shopId;
          const shopsRes = await fetch('/api/shops');
          const shopsData = await shopsRes.json();
          if (shopsData.success) {
            const found = shopsData.data.find((s: Shop) => s.id === shopId);
            if (found) {
              setShop(found);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load shop details:', err);
      }
    }

    loadDashboardData();
    loadShopDetails();

    let socket: any;

    async function setupRealtime() {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        
        if (sessionData.authenticated && sessionData.user.shopId) {
          const shopId = sessionData.user.shopId;
          socket = io();
          
          socket.on('connect', () => {
            socket.emit('join-shop', shopId);
          });

          socket.on('queue-update', () => {
            // Load latest order and performance metrics in real time
            loadDashboardData(true);
          });
        }
      } catch (err) {
        console.error('Failed to set up realtime dashboard:', err);
      }
    }

    setupRealtime();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Compute metrics dynamically from database orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => ['waiting', 'printing'].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === 'collected' && new Date(o.createdAt) >= today);
  
  // Calculate average wait time: 4 minutes per active order
  const averageWaitTime = Math.max(5, pendingOrders.length * 4);

  const activeQueue = orders.filter((o) => ['waiting', 'printing', 'ready'].includes(o.status))
                            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const recentActivity = [...orders]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const totalPagesPrinted = orders
    .filter((o) => o.status === 'collected')
    .reduce((sum, o) => sum + o.totalPages, 0);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)]">Overview of today&apos;s activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
        <StatCard
          title="Today's Orders"
          value={formatNumber(todayOrders.length)}
          icon={<OrdersIcon size={18} />}
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(todayRevenue)}
          icon={<PaymentIcon size={18} />}
        />
        <StatCard
          title="Pending Queue"
          value={formatNumber(pendingOrders.length)}
          icon={<ClockIcon size={18} />}
        />
        <StatCard
          title="Completed Today"
          value={formatNumber(completedOrders.length)}
          icon={<CheckCircleIcon size={18} />}
        />
        <StatCard
          title="Avg Wait Time"
          value={`${averageWaitTime} min`}
          icon={<QueueIcon size={18} />}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Live Queue Preview */}
        <Card className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Live Queue ({activeQueue.length})</h2>
            <Link href="/dashboard/queue" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">
              Open Queue Management <ChevronRightIcon size={12} />
            </Link>
          </div>

          {activeQueue.length === 0 ? (
            <EmptyState
              icon={<QueueIcon size={24} />}
              title="Queue is empty"
              description="No active printing orders right now."
            />
          ) : (
            <div className="space-y-2">
              {activeQueue.slice(0, 5).map((item, i) => (
                <div
                  key={item.orderId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[var(--text-primary)]">#{item.queueNumber}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.studentName}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {item.items.map((it) => it.fileName).join(', ')} · {item.totalPages} pages
                    </p>
                  </div>
                  <Badge
                    variant={
                      item.status === 'ready' ? 'success' :
                      item.status === 'printing' ? 'info' : 'warning'
                    }
                    dot
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                  <span className="text-sm font-semibold text-[var(--text-primary)] flex-shrink-0">
                    {formatCurrency(item.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <div className="space-y-4 animate-slide-in-right">
          <Card>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((order) => (
                  <div key={order.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      order.status === 'ready' ? 'bg-[var(--success)]' :
                      order.status === 'printing' ? 'bg-[var(--info)]' :
                      order.status === 'collected' ? 'bg-[var(--text-muted)]' :
                      'bg-[var(--warning)]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] truncate">
                        <span className="font-medium">{order.studentName}</span>
                        {' '}
                        {order.status === 'waiting' && 'placed a new order'}
                        {order.status === 'printing' && 'order is being printed'}
                        {order.status === 'ready' && 'order is ready'}
                        {order.status === 'collected' && 'collected the order'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {order.orderId} · {formatRelativeTime(order.updatedAt)}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)] flex-shrink-0">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Stats */}
          <Card>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Today&apos;s Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Pages Printed</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {formatNumber(totalPagesPrinted)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Total Active Queue</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {activeQueue.length}
                </span>
              </div>
            </div>
          </Card>

          {/* Shop Counter QR Card */}
          {shop && (
            <Card className="text-center space-y-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] text-left">Shop Counter QR</h2>
              <div className="p-3 bg-[var(--surface-hover)] rounded-2xl flex flex-col items-center justify-center border border-[var(--border-subtle)]">
                <div className="w-24 h-24 bg-white p-1 rounded-xl shadow-sm border border-[var(--border-subtle)] flex items-center justify-center relative overflow-hidden">
                  <QRIcon size={48} className="text-[var(--accent)] opacity-80" />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-2 font-medium">SCAN TO PLACE PRINT ORDERS</p>
              </div>
              <Button size="sm" fullWidth onClick={() => setShowQRModal(true)} icon={<QRIcon size={14} />}>
                View & Print QR Poster
              </Button>
            </Card>
          )}
        </div>
      </div>
      {shop && (
        <ShopQRModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          shop={shop}
        />
      )}
    </div>
  );
}
