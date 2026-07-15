'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge, Skeleton, EmptyState } from '@/app/components/ui';
import { PaymentIcon } from '@/app/components/icons';
import { formatCurrency, formatRelativeTime } from '@/app/lib/utils';

interface Transaction {
  id: string;
  transactionId: string;
  orderId: string;
  studentName: string;
  shopName: string;
  amount: number;
  platformFee: number;
  shopReceived: number;
  method: string;
  status: string;
  createdAt: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      try {
        const response = await fetch('/api/admin/payments');
        const data = await response.json();
        if (data.success) {
          setPayments(data.data);
        }
      } catch (error) {
        console.error('Failed to load payments:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Payments</h1>
        <p className="text-sm text-[var(--text-secondary)]">All payment transactions on the platform</p>
      </div>

      {loading ? (
        <Card className="p-6">
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-8 w-full" />
        </Card>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={<PaymentIcon size={32} />}
          title="No transactions yet"
          description="Paid transactions will show up here as soon as students place print orders."
        />
      ) : (
        <Card padding="none" className="overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-hover)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Transaction</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Order</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Student</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Shop</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Platform Fee</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Shop Received</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Method</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-5 py-3 text-xs font-mono text-[var(--text-secondary)]">{payment.transactionId}</td>
                    <td className="px-5 py-3 text-sm font-medium text-[var(--text-primary)]">{payment.orderId}</td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{payment.studentName}</td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{payment.shopName}</td>
                    <td className="px-5 py-3 text-sm font-medium text-[var(--text-primary)]">{formatCurrency(payment.amount)}</td>
                    <td className="px-5 py-3 text-sm text-[var(--success)] font-medium">{formatCurrency(payment.platformFee)}</td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{formatCurrency(payment.shopReceived)}</td>
                    <td className="px-5 py-3">
                      <Badge>{payment.method.toUpperCase()}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={payment.status === 'paid' ? 'success' : 'error'}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--text-muted)]">{formatRelativeTime(payment.createdAt)}</td>
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
