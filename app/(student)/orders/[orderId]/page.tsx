'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { Card, Badge, ProgressStepper, Skeleton, Button } from '@/app/components/ui';
import { ArrowLeftIcon, FileIcon, ClockIcon } from '@/app/components/icons';
import { formatCurrency, formatRelativeTime, formatWaitTime } from '@/app/lib/utils';
import { getPrintDescription } from '@/app/lib/pricing';
import type { Order } from '@/app/lib/types';

const orderSteps = [
  { id: 'waiting', label: 'Waiting in Queue', description: 'Your order is in the print queue' },
  { id: 'printing', label: 'Printing', description: 'Your documents are being printed' },
  { id: 'ready', label: 'Ready for Collection', description: 'Collect from the shop counter' },
  { id: 'collected', label: 'Collected', description: 'Order complete' },
];

export default function OrderTrackingPage() {
  const params = useParams();
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <Link
          href="/orders"
          className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <ArrowLeftIcon size={16} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
              {order.orderId}
            </h1>
            <Badge
              variant={
                order.status === 'ready' || order.status === 'collected'
                  ? 'success'
                  : order.status === 'printing'
                    ? 'info'
                    : 'warning'
              }
              dot
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-[var(--text-muted)]">{order.shopName}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Left — Tracking */}
        <div className="space-y-5">
          {/* Queue Info */}
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

          {/* Progress Stepper */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-5">Order Status</h3>
            <ProgressStepper steps={orderSteps} currentStep={order.status} />
          </Card>

          {/* Activity / System Updates */}
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
                      <p className="text-xs text-[var(--text-muted)]">
                        {item.pages} pages · {getPrintDescription(item.printOptions)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] text-right">
                    {formatCurrency(item.price)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--border)] pt-3 mt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>Printing</span>
                <span>{formatCurrency(order.printingTotal)}</span>
              </div>
              {order.bindingTotal > 0 && (
                <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>Binding & Extras</span>
                  <span>{formatCurrency(order.bindingTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold text-[var(--text-primary)] pt-1.5 border-t border-[var(--border-subtle)]">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--success)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
              Payment: {order.paymentStatus === 'paid' ? `Paid via ${order.paymentMethod.toUpperCase()}` : 'Pending Counter Payment'}
            </div>

            {order.notes && (
              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-left">
                <p className="font-semibold text-[var(--text-primary)] mb-0.5">Your Note to Shopkeeper:</p>
                <p className="text-[var(--text-secondary)] italic">"{order.notes}"</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl animate-scale-in text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center mx-auto text-xl font-bold">
              ★
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Rate Your Experience</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                How was your print experience at <strong>{order.shopName}</strong>?
              </p>
            </div>

            {/* Star Rating Interactive Grid */}
            <div className="flex justify-center items-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-4xl transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                  style={{
                    color: star <= (hoverRating || rating) ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  ★
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  localStorage.setItem(`rated-${order.id}`, 'skip');
                  setShowRatingModal(false);
                }}
                disabled={submittingRating}
              >
                Skip
              </Button>
              <Button
                className="flex-1"
                onClick={submitRating}
                disabled={rating === 0}
                loading={submittingRating}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
