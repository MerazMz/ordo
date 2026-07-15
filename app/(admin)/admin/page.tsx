'use client';

import React, { useState, useEffect } from 'react';
import { StatCard, Card, Badge, Skeleton, EmptyState } from '@/app/components/ui';
import {
  ShopIcon,
  UsersIcon,
  OrdersIcon,
  PaymentIcon,
  ClockIcon,
  TrendUpIcon,
  AnalyticsIcon,
} from '@/app/components/icons';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/app/lib/utils';
import type { Order } from '@/app/lib/types';

interface DashboardStats {
  totalShops: number;
  totalStudents: number;
  todayOrders: number;
  todayRevenue: number;
  platformRevenue: number;
  commissionEarned: number;
  recentOrders: Order[];
  topShops: {
    shopId: string;
    shopName: string;
    totalOrders: number;
    totalRevenue: number;
  }[];
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminStats() {
      try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to load admin stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAdminStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
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

  const maxRevenue = Math.max(...stats.topShops.map((s) => s.totalRevenue), 1);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)]">Platform overview and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard title="Total Shops" value={stats.totalShops} icon={<ShopIcon size={18} />} />
        <StatCard title="Total Students" value={formatNumber(stats.totalStudents)} icon={<UsersIcon size={18} />} />
        <StatCard title="Today's Orders" value={formatNumber(stats.todayOrders)} icon={<OrdersIcon size={18} />} />
        <StatCard title="Today's Revenue" value={formatCurrency(stats.todayRevenue)} icon={<PaymentIcon size={18} />} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        <StatCard title="Platform Revenue (Gross)" value={formatCurrency(stats.platformRevenue)} icon={<TrendUpIcon size={18} />} />
        <StatCard title="Commission Earned (Net)" value={formatCurrency(stats.commissionEarned)} icon={<AnalyticsIcon size={18} />} />
        <StatCard title="Pending Shops" value={0} icon={<ClockIcon size={18} />} subtitle="All shops verified" />
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Top Shops */}
        <Card className="animate-fade-in-up">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Top Revenue Shops</h3>
          {stats.topShops.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">No shop revenues recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {stats.topShops.map((shop, i) => (
                <div key={shop.shopId} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-md bg-[var(--accent-subtle)] flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)]">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{shop.shopName}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatNumber(shop.totalOrders)} orders</p>
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {formatCurrency(shop.totalRevenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Summary */}
        <Card className="animate-slide-in-right">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Commission Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Platform commission rate</span>
              <span className="font-semibold text-[var(--text-primary)]">10%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Gross volume processed</span>
              <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(stats.platformRevenue)}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-[var(--border-subtle)] pt-3 mt-3">
              <span className="font-medium text-[var(--text-primary)]">Net commissions</span>
              <span className="font-bold text-[var(--success)]">{formatCurrency(stats.commissionEarned)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="animate-fade-in-up">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Recent Platform Orders</h3>
        {stats.recentOrders.length === 0 ? (
          <EmptyState
            icon={<OrdersIcon size={24} />}
            title="No orders placed yet"
            description="Orders placed by college students will show up here in real-time."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-hover)]">
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Order</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Student</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Shop</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Pages</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Payment</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-4 py-2.5 text-sm font-medium text-[var(--text-primary)]">{order.orderId}</td>
                    <td className="px-4 py-2.5 text-sm text-[var(--text-secondary)]">{order.studentName}</td>
                    <td className="px-4 py-2.5 text-sm text-[var(--text-secondary)]">{order.shopName}</td>
                    <td className="px-4 py-2.5 text-sm text-[var(--text-secondary)]">{order.totalPages}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-[var(--text-primary)]">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant={
                          order.status === 'collected' || order.status === 'ready' ? 'success' :
                          order.status === 'printing' ? 'info' :
                          order.status === 'cancelled' ? 'error' : 'warning'
                        }
                        dot
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">{formatRelativeTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
