'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { Card, Badge, ProgressStepper, Skeleton, Button } from '@/app/components/ui';
import { ArrowLeftIcon, FileIcon, ClockIcon } from '@/app/components/icons';
import { formatCurrency, formatRelativeTime, formatWaitTime, cn } from '@/app/lib/utils';
import { getPrintDescription } from '@/app/lib/pricing';
import type { Order } from '@/app/lib/types';
import NotificationBell from '@/app/components/NotificationBell';

const orderSteps = [
  { id: 'waiting', label: 'Waiting in Queue', description: 'Your order is in the print queue' },
  { id: 'printing', label: 'Printing', description: 'Your documents are being printed' },
  { id: 'ready', label: 'Ready for Collection', description: 'Collect from the shop counter' },
  { id: 'collected', label: 'Collected', description: 'Order complete' },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Rating states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();
        if (data.success) {
          setOrder(data.data);
        }
      } catch (error) {
        console.error('Failed to load order:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();

    // Set up WebSocket connection with polling fallback for serverless deploys (e.g. Vercel)
    let socket: any;
    let pollInterval: any;

    try {
      socket = io({
        reconnectionAttempts: 3,
        timeout: 5000,
      });

      socket.on('connect', () => {
        socket.emit('join-order', orderId);
      });

      socket.on('status-update', () => {
        loadOrder();
      });

      socket.on('queue-update', () => {
        loadOrder();
      });

      socket.on('connect_error', () => {
        if (!pollInterval) {
          pollInterval = setInterval(loadOrder, 5000);
        }
      });
    } catch (e) {
      pollInterval = setInterval(loadOrder, 5000);
    }

    return () => {
      if (socket) socket.disconnect();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [orderId]);

  useEffect(() => {
    if (order && order.status === 'collected') {
      const hasRated = localStorage.getItem(`rated-${order.id}`);
      if (!hasRated) {
        setShowRatingModal(true);
      }
    }
  }, [order]);

  const submitRating = async () => {
    if (rating === 0 || !order) return;
    setSubmittingRating(true);
    try {
      const response = await fetch(`/api/shops/${order.shopId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem(`rated-${order.id}`, 'true');
        setShowRatingModal(false);
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Order not found</h2>
        <p className="text-sm text-[var(--text-muted)]">We couldn&apos;t find this order in our records.</p>
        <Link href="/orders">
          <Button variant="secondary">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  // ─── Mobile Timeline ──────────────────────────────────────────────────────────

  type TimelineStatus = 'done' | 'active' | 'pending';
  const statusOrder = ['waiting', 'printing', 'ready', 'collected'];
  const currentIdx = statusOrder.indexOf(order.status);

  const timelineSteps: { icon: React.ReactNode; label: string; status: TimelineStatus; time?: string }[] = [
    {
      label: 'Order Placed',
      status: 'done',
      time: formatRelativeTime(order.createdAt),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      label: 'In Queue',
      status: 'done',
      time: formatRelativeTime(order.createdAt),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          <circle cx="19" cy="11" r="2" /><path d="M23 21v-1a2 2 0 0 0-2-2h-1" />
        </svg>
      ),
    },
    {
      label: 'Printing',
      status: order.status === 'printing' ? 'active' : currentIdx > 1 ? 'done' : 'pending',
      time: currentIdx >= 1 ? formatRelativeTime(order.updatedAt) : undefined,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      ),
    },
    {
      label: 'Ready for Pickup',
      status: order.status === 'ready' || order.status === 'collected' ? 'done' : 'pending',
      time: order.status === 'ready' || order.status === 'collected' ? formatRelativeTime(order.updatedAt) : undefined,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
  ];

  // ─── Mobile View ─────────────────────────────────────────────────────────────

  const MobileView = () => (
    <div className="min-h-screen bg-[var(--background)] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border-subtle)]/45 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="relative max-w-md mx-auto flex items-center justify-between px-4 h-12">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center text-[var(--text-primary)] hover:opacity-75 transition-opacity cursor-pointer focus:outline-none"
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <p className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Order Tracking</p>
          <div className="flex items-center">
            <NotificationBell />
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Printing Illustration */}
        <div className="flex justify-center">
          <div className="relative w-52 h-44">
            <Image src="/printing.png" alt="Printing in progress" fill className="object-contain" priority />
          </div>
        </div>

        {/* Order ID + Status Badge */}
        <div className="text-center space-y-2">
          <h1 className="text-[18px] font-bold text-[var(--text-primary)] tracking-tight">Order #{order.orderId}</h1>
          <span className={cn(
            'inline-flex items-center gap-1.5 px-0 py-0 bg-transparent text-[11px] font-bold',
            order.status === 'printing'
              ? 'text-blue-600 dark:text-blue-400'
              : order.status === 'ready' || order.status === 'collected'
                ? 'text-emerald-600 dark:text-emerald-400'
                : order.status === 'cancelled'
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-amber-500 dark:text-amber-400'
          )}>
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              order.status === 'printing' ? 'bg-blue-500 animate-pulse' :
              order.status === 'ready' || order.status === 'collected' ? 'bg-emerald-500' :
              order.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
            )} />
            {order.status === 'waiting' ? 'In Queue' :
             order.status === 'printing' ? 'In Progress' :
             order.status === 'ready' ? 'Ready for Pickup' :
             order.status === 'collected' ? 'Collected' : 'Cancelled'}
          </span>
        </div>

        {order.status === 'cancelled' && order.cancellationMessage && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-4 text-center space-y-1">
            <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Cancellation Message</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">"{order.cancellationMessage}"</p>
          </div>
        )}

        {/* Queue + wait time pill — only when active */}
        {(order.status === 'waiting' || order.status === 'printing') && (
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 flex items-center justify-around">
            <div className="text-center">
              <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-0.5">Queue #</p>
              <p className="text-[26px] font-black text-[var(--text-primary)] leading-none">#{order.queueNumber}</p>
            </div>
            <div className="w-px h-10 bg-[var(--border-subtle)]" />
            <div className="text-center">
              <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-0.5">Est. Wait</p>
              <p className="text-[18px] font-black text-[var(--text-primary)] leading-none">~ {order.estimatedWaitMinutes} min</p>
            </div>
          </div>
        )}

        {/* Vertical Timeline */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl px-5 pt-4 pb-2">
          {timelineSteps.map((step, idx) => {
            const isLast = idx === timelineSteps.length - 1;
            return (
              <div key={step.label} className="flex gap-4">
                {/* Icon column + connecting line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    step.status === 'done'
                      ? 'bg-emerald-500 text-white'
                      : step.status === 'active'
                        ? 'bg-[var(--text-primary)] text-[var(--background)]'
                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                  )}>
                    {step.icon}
                  </div>
                  {!isLast && (
                    <div className={cn('w-0.5 flex-1 my-1 min-h-[28px]', step.status === 'done' ? 'bg-emerald-400' : 'bg-[var(--border-subtle)]')} />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 flex items-start justify-between pb-5">
                  <p className={cn(
                    'text-sm mt-2.5',
                    step.status === 'active' ? 'font-bold text-[var(--text-primary)]' :
                    step.status === 'done' ? 'font-medium text-[var(--text-primary)]' :
                    'text-[var(--text-muted)]'
                  )}>
                    {step.label}
                  </p>
                  <p className={cn('text-[12px] mt-2.5 flex-shrink-0 ml-2', step.time ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]')}>
                    {step.time ?? 'Pending'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Need Help? — pinned above bottom nav */}
      <div className="fixed bottom-16 left-0 right-0 px-5 pb-3 pt-2 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-transparent">
        <button className="w-full py-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] flex items-center justify-center gap-2 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          </svg>
          Need Help?
        </button>
      </div>
    </div>
  );

  // ─── Desktop View ─────────────────────────────────────────────────────────────

  const RatingModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in">
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl animate-scale-in text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center mx-auto text-xl font-bold">★</div>
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Rate Your Experience</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            How was your print experience at <strong>{order.shopName}</strong>?
          </p>
        </div>
        <div className="flex justify-center items-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="text-4xl transition-transform hover:scale-110 cursor-pointer focus:outline-none" style={{ color: star <= (hoverRating || rating) ? 'var(--accent)' : 'var(--border)' }}>★</button>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button variant="secondary" className="flex-1" onClick={() => { localStorage.setItem(`rated-${order.id}`, 'skip'); setShowRatingModal(false); }} disabled={submittingRating}>Skip</Button>
          <Button className="flex-1" onClick={submitRating} disabled={rating === 0} loading={submittingRating}>Submit</Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <MobileView />
        {showRatingModal && <RatingModal />}
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 animate-fade-in">
            <Link href="/orders" className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
              <ArrowLeftIcon size={16} />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">{order.orderId}</h1>
                <Badge variant={order.status === 'ready' || order.status === 'collected' ? 'success' : order.status === 'printing' ? 'info' : 'warning'} dot>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{order.shopName}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-6">
            {/* Left — Tracking */}
            <div className="space-y-5">
              {(order.status === 'waiting' || order.status === 'printing') && (
                <Card className="relative overflow-hidden animate-fade-in-up">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--info)]" />
                  <div className="flex items-center gap-6 pt-2">
                    <div className="text-center">
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Queue</p>
                      <p className="text-4xl font-bold text-[var(--text-primary)]">#{order.queueNumber}</p>
                    </div>
                    <div className="w-px h-12 bg-[var(--border)]" />
                    <div>
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Est. Wait</p>
                      <p className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <ClockIcon size={16} className="text-[var(--text-muted)]" />
                        {formatWaitTime(order.estimatedWaitMinutes)}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-5">Order Status</h3>
                <ProgressStepper steps={orderSteps} currentStep={order.status} />
              </Card>

              <Card className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Activity Timeline</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 bg-[var(--success)] flex-shrink-0" />
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">Order Submitted</p>
                      <p className="text-xs text-[var(--text-muted)]">Your document files have been sent to the shop and queue locked.</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatRelativeTime(order.createdAt)}</p>
                    </div>
                  </div>
                  {order.paidAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 bg-[var(--success)] flex-shrink-0" />
                      <div>
                        <p className="text-sm text-[var(--text-primary)]">Payment Confirmed</p>
                        <p className="text-xs text-[var(--text-muted)]">Payment of {formatCurrency(order.totalAmount)} received via {order.paymentMethod.toUpperCase()}.</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatRelativeTime(order.paidAt)}</p>
                      </div>
                    </div>
                  )}
                  {order.status === 'printing' && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 bg-[var(--info)] flex-shrink-0 animate-pulse" />
                      <div>
                        <p className="text-sm text-[var(--text-primary)]">Now Printing</p>
                        <p className="text-xs text-[var(--text-muted)]">The shopkeeper has started printing your documents.</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatRelativeTime(order.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                  {(order.status === 'ready' || order.status === 'collected') && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 bg-[var(--success)] flex-shrink-0" />
                      <div>
                        <p className="text-sm text-[var(--text-primary)]">Ready for Collection</p>
                        <p className="text-xs text-[var(--text-muted)]">Documents are ready. Please collect from the counter immediately.</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatRelativeTime(order.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right — Order Details */}
            <div className="lg:sticky lg:top-20 lg:self-start space-y-4 animate-slide-in-right">
              <Card>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Order Details</h3>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.fileId} className="pb-3 border-b border-[var(--border-subtle)] last:border-0 last:pb-0">
                      <div className="flex items-start gap-2 mb-1">
                        <FileIcon size={14} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.fileName}</p>
                          <p className="text-xs text-[var(--text-muted)]">{item.pages} pages · {getPrintDescription(item.printOptions)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] text-right">{formatCurrency(item.price)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[var(--border)] pt-3 mt-3 space-y-1.5">
                  <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                    <span>Printing</span><span>{formatCurrency(order.printingTotal)}</span>
                  </div>
                  {order.bindingTotal > 0 && (
                    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                      <span>Binding &amp; Extras</span><span>{formatCurrency(order.bindingTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold text-[var(--text-primary)] pt-1.5 border-t border-[var(--border-subtle)]">
                    <span>Total</span><span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-[var(--success)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                  Payment: {order.paymentStatus === 'paid' ? `Paid via ${order.paymentMethod.toUpperCase()}` : 'Pending Counter Payment'}
                </div>
                {order.notes && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-left">
                    <p className="font-semibold text-[var(--text-primary)] mb-0.5">Your Note to Shopkeeper:</p>
                    <p className="text-[var(--text-secondary)] italic">&quot;{order.notes}&quot;</p>
                  </div>
                )}
                {order.status === 'cancelled' && order.cancellationMessage && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-left">
                    <p className="font-semibold text-red-500 mb-0.5">Cancellation Reason:</p>
                    <p className="text-[var(--text-secondary)] italic">&quot;{order.cancellationMessage}&quot;</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>

        {showRatingModal && <RatingModal />}
      </div>
    </>
  );
}
