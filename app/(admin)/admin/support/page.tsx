"use client";

import React, { useState, useEffect } from "react";
import { Card, Badge, Button, EmptyState, Skeleton } from "@/app/components/ui";
import { OrdersIcon } from "@/app/components/icons";
import { formatRelativeTime, formatCurrency } from "@/app/lib/utils";

interface CancelledOrder {
  id: string;
  orderId: string;
  studentName: string;
  shopName: string;
  totalAmount: number;
  cancellationMessage: string | null;
  createdAt: string;
  reviewed?: boolean;
}

export default function AdminSupportPage() {
  const [orders, setOrders] = useState<CancelledOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadCancelledOrders() {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (data.success) {
          const cancelled = (data.data as any[]).filter((o: any) => o.status === "cancelled");
          setOrders(cancelled);
        }
      } catch (e) {
        console.error("Failed to load cancelled orders:", e);
      } finally {
        setLoading(false);
      }
    }
    loadCancelledOrders();
  }, []);

  const handleReview = (id: string) => {
    setReviewed((prev) => new Set([...prev, id]));
  };

  const unreviewed = orders.filter((o) => !reviewed.has(o.id));
  const reviewedList = orders.filter((o) => reviewed.has(o.id));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Support / Cancelled Orders</h1>
          <p className="text-sm text-[var(--text-secondary)]">Review cancelled orders and customer issues</p>
        </div>
        {orders.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)]">
            <span className="w-2 h-2 rounded-full bg-[var(--error)]"></span>
            <span className="text-xs font-semibold text-[var(--text-primary)]">{unreviewed.length} pending</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      ) : unreviewed.length === 0 && reviewedList.length === 0 ? (
        <EmptyState
          icon={<OrdersIcon size={32} />}
          title="No cancelled orders"
          description="Cancelled orders with their reasons from shopkeepers will appear here."
        />
      ) : (
        <div className="space-y-4">
          {unreviewed.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Pending Review</p>
              {unreviewed.map((order) => (
                <Card key={order.id} className="animate-fade-in-up border-l-4 border-l-[var(--error)]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Order #{order.orderId}</h3>
                        <Badge variant="error" dot>Cancelled</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span>{order.studentName}</span>
                        <span>•</span>
                        <span>{order.shopName}</span>
                        <span>•</span>
                        <span>{formatCurrency(order.totalAmount)}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(order.createdAt)}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleReview(order.id)} className="shrink-0">
                      Mark Reviewed
                    </Button>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--error-bg)] border border-[var(--error-border)]">
                    <p className="text-xs font-semibold text-[var(--error)] mb-1">Cancellation Reason</p>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {order.cancellationMessage || "No reason provided by shopkeeper."}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {reviewedList.length > 0 && (
            <div className="space-y-3 opacity-60">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Reviewed</p>
              {reviewedList.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Order #{order.orderId}</h3>
                        <Badge>Reviewed</Badge>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{order.studentName} • {order.shopName}</p>
                    </div>
                    <span className="text-xs text-[var(--success)] font-medium">Done</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
