'use client';

import React, { useState, useEffect } from 'react';
import { Card, StatCard, Skeleton } from '@/app/components/ui';
import { PaymentIcon, ShopIcon, AnalyticsIcon, ClockIcon, TrendUpIcon, PrinterIcon } from '@/app/components/icons';
import { formatCurrency, formatNumber } from '@/app/lib/utils';
import type { Order } from '@/app/lib/types';

interface StatsData {
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

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
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
    loadStats();
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
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...stats.topShops.map((s) => s.totalRevenue), 1);
  const totalPagesPrinted = stats.recentOrders.reduce((sum, o) => sum + o.totalPages, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Platform Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)]">Comprehensive platform insights and trends</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard title="Monthly Revenue" value={formatCurrency(stats.commissionEarned)} icon={<PaymentIcon size={18} />} />
        <StatCard title="Total Orders" value={formatNumber(stats.recentOrders.length)} icon={<AnalyticsIcon size={18} />} />
        <StatCard title="Active Shops" value={stats.totalShops} icon={<ShopIcon size={18} />} />
        <StatCard title="Pages Printed" value={totalPagesPrinted} icon={<PrinterIcon size={18} />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Shops by Revenue */}
        <Card className="animate-fade-in-up">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Shop Performance</h3>
          {stats.topShops.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-16">No shop transactions recorded yet.</p>
          ) : (
            <div className="flex items-end gap-3 h-52 pt-6">
              {stats.topShops.map((shop, i) => (
                <div key={shop.shopId} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    className="w-full rounded-t-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all cursor-pointer relative group min-h-[4px]"
                    style={{ height: `${(shop.totalRevenue / maxRevenue) * 90}%` }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-[var(--accent)] text-[var(--text-inverse)] text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
                      {formatCurrency(shop.totalRevenue)}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-[var(--text-muted)] truncate max-w-[80px] block text-center">
                    {shop.shopName}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Platform Share Overview */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Revenue Split (Gross vs Net)</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="text-[var(--text-secondary)]">Shopkeeper Share (90%)</span>
                <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(stats.platformRevenue * 0.9)}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: '90%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="text-[var(--text-secondary)]">Ordo Commission (10%)</span>
                <span className="font-semibold text-[var(--success)]">{formatCurrency(stats.commissionEarned)}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--success)]" style={{ width: '10%' }} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
