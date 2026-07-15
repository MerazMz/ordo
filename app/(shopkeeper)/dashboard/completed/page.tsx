'use client';

import React, { useState, useEffect } from 'react';
import { Card, Skeleton, EmptyState } from '@/app/components/ui';
import { CheckCircleIcon } from '@/app/components/icons';
import { formatCurrency, formatRelativeTime } from '@/app/lib/utils';
import type { Order } from '@/app/lib/types';

export default function CompletedPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompletedOrders() {
      try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        if (data.success) {
          const completed = data.data.filter((o: Order) => o.status === 'collected');
          setOrders(completed);
        }
      } catch (error) {
        console.error('Failed to load completed orders:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCompletedOrders();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Completed</h1>
        <p className="text-sm text-[var(--text-secondary)]">Orders that have been collected</p>
      </div>

      {loading ? (
        <Card className="p-6">
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-8 w-full" />
        </Card>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<CheckCircleIcon size={24} />}
          title="No completed orders yet"
          description="Completed orders will appear here once students collect their prints."
        />
      ) : (
        <Card padding="none" className="overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-hover)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Order</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Student</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Files</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Pages</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{order.orderId}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--text-primary)]">{order.studentName}</td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">
                      {order.items.map((i) => i.fileName).join(', ')}
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{order.totalPages}</td>
                    <td className="px-5 py-3 text-sm font-medium text-[var(--text-primary)]">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-5 py-3 text-xs text-[var(--text-muted)]">{formatRelativeTime(order.completedAt || order.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
