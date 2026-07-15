'use client';

import React, { useState, useEffect } from 'react';
import { Card, Avatar, Skeleton, EmptyState } from '@/app/components/ui';
import { UsersIcon } from '@/app/components/icons';
import { formatCurrency, formatNumber } from '@/app/lib/utils';
import type { Order } from '@/app/lib/types';

interface CustomerSummary {
  studentName: string;
  studentPhone: string;
  totalOrders: number;
  totalSpent: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        if (data.success) {
          // Compile a list of unique customers from orders
          const orders: Order[] = data.data;
          const map: Record<string, CustomerSummary> = {};

          orders.forEach((o) => {
            const key = o.studentPhone;
            if (!map[key]) {
              map[key] = {
                studentName: o.studentName,
                studentPhone: o.studentPhone,
                totalOrders: 0,
                totalSpent: 0,
              };
            }
            map[key].totalOrders += 1;
            map[key].totalSpent += o.totalAmount;
          });

          setCustomers(Object.values(map));
        }
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Customers</h1>
        <p className="text-sm text-[var(--text-secondary)]">Students who have ordered from your shop</p>
      </div>

      {loading ? (
        <Card className="p-6">
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-8 w-full" />
        </Card>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<UsersIcon size={32} />}
          title="No customers yet"
          description="Your customers list will be built automatically as students place print orders."
        />
      ) : (
        <Card padding="none" className="overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-hover)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Student</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Orders</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {customers.map((student) => (
                  <tr key={student.studentPhone} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.studentName} size="sm" />
                        <p className="text-sm font-medium text-[var(--text-primary)]">{student.studentName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{student.studentPhone}</td>
                    <td className="px-5 py-3 text-sm text-[var(--text-primary)] font-medium">{formatNumber(student.totalOrders)}</td>
                    <td className="px-5 py-3 text-sm text-[var(--text-primary)] font-medium">{formatCurrency(student.totalSpent)}</td>
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
