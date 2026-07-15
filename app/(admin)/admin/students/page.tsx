'use client';

import React, { useState, useEffect } from 'react';
import { Card, Avatar, Skeleton, EmptyState } from '@/app/components/ui';
import { UsersIcon } from '@/app/components/icons';
import { formatCurrency, formatNumber, formatDate } from '@/app/lib/utils';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string | null;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      try {
        const response = await fetch('/api/admin/students');
        const data = await response.json();
        if (data.success) {
          setStudents(data.data);
        }
      } catch (error) {
        console.error('Failed to load students:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Students</h1>
        <p className="text-sm text-[var(--text-secondary)]">All registered students on the platform</p>
      </div>

      {loading ? (
        <Card className="p-6">
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-8 w-full" />
        </Card>
      ) : students.length === 0 ? (
        <EmptyState
          icon={<UsersIcon size={32} />}
          title="No registered students"
          description="Student users will appear here after registering their email or phone numbers on the sign-up page."
        />
      ) : (
        <Card padding="none" className="overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-hover)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Student</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">College</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Orders</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Total Spent</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} size="sm" />
                        <p className="text-sm font-medium text-[var(--text-primary)]">{student.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{student.email}</td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{student.phone}</td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{student.college || '—'}</td>
                    <td className="px-5 py-3 text-sm font-medium text-[var(--text-primary)]">{formatNumber(student.totalOrders)}</td>
                    <td className="px-5 py-3 text-sm text-[var(--text-primary)] font-medium">{formatCurrency(student.totalSpent)}</td>
                    <td className="px-5 py-3 text-xs text-[var(--text-muted)]">{formatDate(student.createdAt)}</td>
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
