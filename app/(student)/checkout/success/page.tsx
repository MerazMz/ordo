'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button, Card } from '@/app/components/ui';
import { CheckCircleIcon, ClockIcon, QueueIcon, CopyIcon } from '@/app/components/icons';
import { cn } from '@/app/lib/utils';

// ─── Mobile Success View ──────────────────────────────────────────────────────

function MobileSuccessView({
  queueNumber,
  estimatedWait,
  orderId,
}: {
  queueNumber: string;
  estimatedWait: string;
  orderId: string;
}) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 bg-[var(--background)] flex flex-col items-center justify-between px-6 pt-12 pb-32 text-center overflow-hidden">
      {/* Wrapper to hold items and center them */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto space-y-6">
        {/* Confirmation Illustration */}
        <div className={cn('relative w-44 h-44 transition-all duration-700', showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90')}>
          <Image src="/confirmation.png" alt="Order confirmed" fill className="object-contain" priority />
        </div>

        {/* Title */}
        <div className={cn('transition-all duration-500 delay-200', showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
          <h1 className="text-[22px] font-bold text-[var(--text-primary)] tracking-tight mb-2">
            Order Confirmed!
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            Your order has been placed<br />successfully.
          </p>
        </div>

        {/* Queue Card */}
        <div className={cn('w-full transition-all duration-500 delay-300', showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-5 flex items-center justify-around">
            <div className="text-left">
              <p className="text-[11px] text-[var(--text-muted)] font-medium mb-1">Your Queue Number</p>
              <p className="text-[32px] font-black text-[var(--text-primary)] leading-none tracking-tight">
                #{String(queueNumber).padStart(2, '0')}
              </p>
            </div>
            <div className="w-px h-12 bg-[var(--border-subtle)]" />
            <div className="text-left">
              <p className="text-[11px] text-[var(--text-muted)] font-medium mb-1">Estimated Time</p>
              <p className="text-[22px] font-black text-[var(--text-primary)] leading-none tracking-tight">
                ~ {estimatedWait} min
              </p>
            </div>
          </div>
        </div>

        {/* Notification text */}
        <p className={cn('text-[13px] text-[var(--text-muted)] leading-relaxed transition-all duration-500 delay-400', showContent ? 'opacity-100' : 'opacity-0')}>
          We&apos;ll notify you when<br />your order is ready.
        </p>
      </div>

      {/* View Orders CTA */}
      <div className="w-full max-w-sm px-2">
        <Link href="/orders" className="block w-full">
          <button className="w-full py-4 rounded-2xl bg-[var(--text-primary)] text-[var(--background)] text-sm font-bold tracking-wide hover:opacity-90 transition-opacity">
            View My Orders
          </button>
        </Link>
      </div>
    </div>
  );
}

// ─── Desktop Success View ─────────────────────────────────────────────────────

function DesktopSuccessView({
  orderId,
  queueNumber,
  estimatedWait,
  shopName,
}: {
  orderId: string;
  queueNumber: string;
  estimatedWait: string;
  shopName: string;
}) {
  const [showContent, setShowContent] = useState(false);
  const [copied, setCopied] = useState(false);

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
        <div className={cn('absolute inset-0 rounded-full bg-[var(--success)] transition-transform duration-500 ease-[var(--ease-spring)]', showContent ? 'scale-100' : 'scale-0')} />
        <div className={cn('absolute inset-0 flex items-center justify-center transition-all duration-300 delay-300', showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50')}>
          <CheckCircleIcon size={40} className="text-white" />
        </div>
        <div className={cn('absolute inset-0 rounded-full bg-[var(--success)] animate-ping opacity-20', showContent ? '' : 'hidden')} />
      </div>

      <div className={cn('transition-all duration-500 delay-200', showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1">Order Placed Successfully!</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">Your order has been queued at {shopName}</p>
      </div>

      <div className={cn('transition-all duration-500 delay-400', showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
        <Card className="mb-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--success)] via-[var(--info)] to-[var(--accent)]" />
          <div className="pt-2">
            <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-medium mb-2">Queue Number</p>
            <p className="text-6xl font-bold text-[var(--text-primary)] tracking-tighter mb-4">#{queueNumber}</p>
            <div className="flex items-center justify-center gap-2 text-[var(--success)] mb-4">
              <ClockIcon size={16} />
              <span className="text-sm font-medium">Estimated Wait: {estimatedWait} minutes</span>
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

      <div className={cn('transition-all duration-500 delay-500', showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
        <Card className="mb-6 bg-[var(--accent-subtle)] border border-[var(--accent)] text-left">
          <div className="flex gap-3 items-start p-1">
            <span className="text-2xl shrink-0">📱</span>
            <div>
              <p className="text-sm font-semibold text-[var(--accent)]">Pay at the Counter</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                Please scan the physical <strong>Ordo Shop QR Code</strong> at the counter of <strong>{shopName}</strong> and complete the payment to start printing your files.
              </p>
            </div>
          </div>
        </Card>

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

// ─── Page Content ─────────────────────────────────────────────────────────────

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  const orderId = searchParams.get('orderId') || 'ORD-2026-0000';
  const queueNumber = searchParams.get('queue') || '1';
  const estimatedWait = searchParams.get('wait') || '5';
  const shopName = searchParams.get('shop') || 'Campus Print Hub';

  return (
    <>
      {/* Mobile Success */}
      <div className="md:hidden">
        <MobileSuccessView
          queueNumber={queueNumber}
          estimatedWait={estimatedWait}
          orderId={orderId}
        />
      </div>

      {/* Desktop Success */}
      <div className="hidden md:block">
        <DesktopSuccessView
          orderId={orderId}
          queueNumber={queueNumber}
          estimatedWait={estimatedWait}
          shopName={shopName}
        />
      </div>
    </>
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
