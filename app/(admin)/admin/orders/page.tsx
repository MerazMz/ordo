'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge, Skeleton, EmptyState } from '@/app/components/ui';
import { OrdersIcon } from '@/app/components/icons';
import { formatCurrency, formatRelativeTime } from '@/app/lib/utils';
import type { Order } from '@/app/lib/types';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Order Monitoring</h1>
        <p className="text-sm text-[var(--text-secondary)]">Real-time view of all platform orders</p>
      </div>

      {loading ? (
        <Card className="p-6">
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-8 w-full" />
        </Card>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<OrdersIcon size={32} />}
          title="No orders placed yet"
          description="Orders placed by college students will show up here in real-time."
        />
      ) : (
        <Card padding="none" className="overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-hover)]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Shop</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Pages</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Queue #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">{order.orderId}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{order.studentName}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{order.shopName}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{order.totalPages}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">#{order.queueNumber}</td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{formatRelativeTime(order.createdAt)}</td>
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
