'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge, Tabs, Skeleton, EmptyState } from '@/app/components/ui';
import { OrdersIcon } from '@/app/components/icons';
import { formatCurrency, formatRelativeTime } from '@/app/lib/utils';
import type { OrderStatus, Order } from '@/app/lib/types';

const statusVariant: Record<OrderStatus, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  waiting: 'warning', printing: 'info', ready: 'success', collected: 'default', cancelled: 'error',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

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

  const tabs = [
    { id: 'all', label: 'All', count: orders.length },
    { id: 'waiting', label: 'Waiting', count: orders.filter((o) => o.status === 'waiting').length },
    { id: 'printing', label: 'Printing', count: orders.filter((o) => o.status === 'printing').length },
    { id: 'ready', label: 'Ready', count: orders.filter((o) => o.status === 'ready').length },
    { id: 'collected', label: 'Collected', count: orders.filter((o) => o.status === 'collected').length },
  ];

  const filtered = orders.filter((o) => activeTab === 'all' ? true : o.status === activeTab);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Orders</h1>
        <p className="text-sm text-[var(--text-secondary)]">All orders for your shop</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {loading ? (
        <Card className="p-6">
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-8 w-full" />
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<OrdersIcon size={32} />}
          title="No orders found"
          description={`No orders with status "${activeTab}" have been registered at your shop.`}
        />
      ) : (
        /* Orders Table */
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
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Payment</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{order.orderId}</p>
                      <p className="text-xs text-[var(--text-muted)]">Q#{order.queueNumber}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-[var(--text-primary)]">{order.studentName}</p>
                      <p className="text-xs text-[var(--text-muted)]">{order.studentPhone}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-[var(--text-secondary)] max-w-[150px] truncate" title={order.items.map((i) => i.fileName).join(', ')}>
                        {order.items.map((i) => i.fileName).join(', ')}
                      </p>
                      {order.notes && (
                        <p className="text-[10px] text-[var(--text-muted)] italic truncate max-w-[150px] mt-0.5" title={order.notes}>
                          📝 Note: "{order.notes}"
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{order.totalPages}</td>
                    <td className="px-5 py-3 text-sm font-medium text-[var(--text-primary)]">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariant[order.status as OrderStatus] || 'default'} dot>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--text-muted)]">
                      {formatRelativeTime(order.createdAt)}
                    </td>
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
