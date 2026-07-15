'use client';

import React, { useState, useEffect } from 'react';
import { Card, StatCard, Skeleton } from '@/app/components/ui';
import {
  PaymentIcon,
  PrinterIcon,
  ClockIcon,
  AnalyticsIcon,
} from '@/app/components/icons';
import { formatCurrency, formatNumber } from '@/app/lib/utils';
import type { Order } from '@/app/lib/types';

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
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

  // Compute stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPages = orders.reduce((sum, o) => sum + o.totalPages, 0);
  const totalOrders = orders.length;
  
  const pendingOrders = orders.filter((o) => ['waiting', 'printing'].includes(o.status));
  const averageWaitTime = Math.max(5, pendingOrders.length * 4);

  // Group by day for last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  }).reverse();

  const dailyRevenue = last7Days.map((date) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayOrders = orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= date && orderDate < nextDate;
    });

    return {
      date: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    };
  });

  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);

  // Group print options distribution
  let bwCount = 0;
  let colorCount = 0;
  let bindingCount = 0;

  orders.forEach((o) => {
    o.items.forEach((it) => {
      if (it.printOptions.color === 'color') colorCount += 1;
      else bwCount += 1;
      if (it.printOptions.spiralBinding) bindingCount += 1;
    });
  });

  const totalItems = Math.max(1, bwCount + colorCount);
  const bwPercentage = Math.round((bwCount / totalItems) * 100);
  const colorPercentage = Math.round((colorCount / totalItems) * 100);
  const bindingPercentage = Math.round((bindingCount / Math.max(1, totalOrders)) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)]">Shop performance and insights</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<PaymentIcon size={18} />}
        />
        <StatCard
          title="Pages Printed"
          value={formatNumber(totalPages)}
          icon={<PrinterIcon size={18} />}
        />
        <StatCard
          title="Avg Wait Time"
          value={`${averageWaitTime} min`}
          icon={<ClockIcon size={18} />}
        />
        <StatCard
          title="Total Orders"
          value={formatNumber(totalOrders)}
          icon={<AnalyticsIcon size={18} />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="animate-fade-in-up">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Revenue (Last 7 Days)</h3>
          {totalOrders === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-16">No sales recorded in the last 7 days.</p>
          ) : (
            <div className="flex items-end gap-3 h-52 pt-6">
              {dailyRevenue.map((point, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    className="w-full rounded-t-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all cursor-pointer relative group min-h-[4px]"
                    style={{ height: `${(point.revenue / maxRevenue) * 90}%` }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-[var(--accent)] text-[var(--text-inverse)] text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
                      {formatCurrency(point.revenue)}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-[var(--text-muted)]">{point.date}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Popular Services */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Popular Services</h3>
          {totalOrders === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-16">No prints ordered yet.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[var(--text-primary)] font-medium">B&W Printing</span>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{bwPercentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${bwPercentage}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[var(--text-primary)] font-medium">Color Printing</span>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{colorPercentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--info)]" style={{ width: `${colorPercentage}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[var(--text-primary)] font-medium">Spiral Binding</span>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{bindingPercentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${bindingPercentage}%` }} />
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
