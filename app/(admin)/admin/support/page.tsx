'use client';

import React, { useState } from 'react';
import { Card, Badge, Button, EmptyState } from '@/app/components/ui';

interface SupportTicket {
  id: string;
  userName: string;
  userRole: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'ticket-1',
      userName: 'Amit Sharma',
      userRole: 'student',
      subject: 'Double Payment Charged',
      message: 'I was charged twice for order #ORD-2026-1002. Google Pay shows debited twice but queue locked once. Please process refund.',
      status: 'open',
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: 'ticket-2',
      userName: 'Vikas (Campus Print Center)',
      userRole: 'shopkeeper',
      subject: 'Scanner Offline Error',
      message: 'My primary color scanner scanner-3 is showing connection error in dashboard settings. Can you reset the verification?',
      status: 'in-progress',
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    }
  ]);

  const handleResolve = (id: string) => {
    setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Support Requests</h1>
        <p className="text-sm text-[var(--text-secondary)]">Manage user support tickets</p>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          title="All support tickets resolved"
          description="There are currently no active support requests from students or shopkeepers."
        />
      ) : (
        <div className="space-y-3 stagger-children">
          {tickets.map((request) => (
            <Card key={request.id} className="animate-fade-in-up">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{request.subject}</h3>
                    <Badge variant={request.status === 'open' ? 'warning' : 'info'} dot>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>{request.userName}</span>
                    <span>•</span>
                    <Badge>{request.userRole.toUpperCase()}</Badge>
                  </div>
                </div>
              </div>

              <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">{request.message}</p>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm">Respond</Button>
                <Button size="sm" className="bg-[var(--success)] hover:bg-[var(--success)]/90 border-none" onClick={() => handleResolve(request.id)}>
                  Resolve Ticket
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
