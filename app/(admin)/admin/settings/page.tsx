'use client';

import React, { useState } from 'react';
import { Card, Button, Input } from '@/app/components/ui';

export default function AdminSettingsPage() {
  const [commissionRate, setCommissionRate] = useState('10');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Platform Settings</h1>
        <p className="text-sm text-[var(--text-secondary)]">Configure platform-wide settings</p>
      </div>

      {/* Commission */}
      <Card className="animate-fade-in-up">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Commission Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Commission Percentage (%)"
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
          />
          <div className="flex items-end">
            <Button>Update Commission</Button>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          Platform takes {commissionRate}% of every transaction as commission.
        </p>
      </Card>

      {/* Pricing Rules */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Default Pricing Rules</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Input label="B&W per page (₹)" type="number" defaultValue="3" />
          <Input label="Color per page (₹)" type="number" defaultValue="10" />
          <Input label="Staple (₹)" type="number" defaultValue="5" />
          <Input label="Spiral Binding (₹)" type="number" defaultValue="30" />
          <Input label="Lamination (₹)" type="number" defaultValue="20" />
        </div>
        <div className="mt-4 flex justify-end">
          <Button>Save Pricing</Button>
        </div>
      </Card>
    </div>
  );
}
