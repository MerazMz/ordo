'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button, Card } from '@/app/components/ui';
import { CheckCircleIcon, ClockIcon, QueueIcon, CopyIcon } from '@/app/components/icons';
import { cn } from '@/app/lib/utils';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [showContent, setShowContent] = useState(false);
  const [copied, setCopied] = useState(false);

  const orderId = searchParams.get('orderId') || 'ORD-2026-0000';
  const queueNumber = searchParams.get('queue') || '0';
  const estimatedWait = searchParams.get('wait') || '5';
  const shopName = searchParams.get('shop') || 'Campus Print Hub';

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      {/* Success Animation */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className={cn(
          'absolute inset-0 rounded-full bg-[var(--success)] transition-transform duration-500 ease-[var(--ease-spring)]',
          showContent ? 'scale-100' : 'scale-0'
        )} />
        <div className={cn(
          'absolute inset-0 flex items-center justify-center transition-all duration-300 delay-300',
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        )}>
          <CheckCircleIcon size={40} className="text-white" />
        </div>
        {/* Pulse ring */}
        <div className={cn(
          'absolute inset-0 rounded-full bg-[var(--success)] animate-ping opacity-20',
          showContent ? '' : 'hidden'
        )} />
      </div>

      {/* Title */}
      <div className={cn(
        'transition-all duration-500 delay-200',
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1">
          Order Placed Successfully!
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          Your order has been queued at {shopName}
        </p>
      </div>

      {/* Queue Number Card */}
      <div className={cn(
        'transition-all duration-500 delay-400',
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        <Card className="mb-6 overflow-hidden relative">
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--success)] via-[var(--info)] to-[var(--accent)]" />

          <div className="pt-2">
            <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-medium mb-2">
              Queue Number
            </p>
            <p className="text-6xl font-bold text-[var(--text-primary)] tracking-tighter mb-4">
              #{queueNumber}
            </p>

            <div className="flex items-center justify-center gap-2 text-[var(--success)] mb-4">
              <ClockIcon size={16} />
              <span className="text-sm font-medium">
                Estimated Wait: {estimatedWait} minutes
              </span>
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-4 flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--text-muted)]">Order ID</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{orderId}</p>
              </div>
              <button
                onClick={copyOrderId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] transition-colors cursor-pointer"
              >
                <CopyIcon size={12} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Status Info */}
      <div className={cn(
        'transition-all duration-500 delay-500',
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        <Card className="mb-6 bg-[var(--accent-subtle)] border border-[var(--accent)] text-left">
          <div className="flex gap-3 items-start p-1">
            <span className="text-2xl shrink-0">📱</span>
            <div>
              <p className="text-sm font-semibold text-[var(--accent)]">Pay at the Counter</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                Please scan the physical **Ordo Shop QR Code** at the counter of **{shopName}** and complete the payment to start printing your files.
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Link href={`/orders/${orderId}`} className="block">
            <Button size="lg" fullWidth>
              <QueueIcon size={18} />
              Track Order
            </Button>
          </Link>
          <Link href="/shops" className="block">
            <Button variant="secondary" size="lg" fullWidth>
              Place Another Order
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto px-6 py-32 text-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[var(--text-secondary)]">Loading order details...</p>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
