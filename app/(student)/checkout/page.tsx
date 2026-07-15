'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Skeleton } from '@/app/components/ui';
import { ArrowLeftIcon } from '@/app/components/icons';
import { formatCurrency } from '@/app/lib/utils';
import { useUpload } from '@/app/lib/store';
import { calculateFilePrintingCost, calculateExtras, getPrintDescription } from '@/app/lib/pricing';
import type { Shop } from '@/app/lib/types';

export default function CheckoutPage() {
  const { files, selectedShopId, clearFiles, notes, setNotes } = useUpload();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  // Load shop details
  useEffect(() => {
    async function loadShop() {
      if (!selectedShopId) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/shops');
        const data = await response.json();
        if (data.success) {
          const found = data.data.find((s: Shop) => s.id === selectedShopId);
          if (found) {
            setShop(found);
          }
        }
      } catch (error) {
        console.error('Failed to load shop:', error);
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, [selectedShopId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (files.length === 0 || !selectedShopId || !shop) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Your cart is empty</h2>
        <p className="text-sm text-[var(--text-muted)]">Please select a shop and upload documents before checking out.</p>
        <Link href="/shops" className="inline-block">
          <Button>Browse Shops</Button>
        </Link>
      </div>
    );
  }

  // Calculate pricing using DB pricing rules
  const totalPages = files.reduce((sum, f) => sum + f.pages, 0);
  const printingTotal = files.reduce(
    (sum, f) => sum + calculateFilePrintingCost(f.pages, f.printOptions, shop),
    0
  );
  const bindingTotal = files.reduce(
    (sum, f) => sum + calculateExtras(f.printOptions, shop),
    0
  );
  const grandTotal = printingTotal + bindingTotal;

  const handlePlaceOrder = async () => {
    setProcessing(true);
    try {
      const payload = {
        shopId: selectedShopId,
        items: files.map((f) => ({
          fileId: f.id,
          fileName: f.name,
          pages: f.pages,
          price: calculateFilePrintingCost(f.pages, f.printOptions, shop) + calculateExtras(f.printOptions, shop),
          printOptions: f.printOptions,
          fileData: f.fileData,
        })),
        totalPages,
        totalAmount: grandTotal,
        bindingTotal,
        printingTotal,
        paymentMethod: 'counter',
        notes,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Success - Clear cart and redirect
      clearFiles();
      const order = data.data;
      router.push(
        `/checkout/success?orderId=${order.orderId}&queue=${order.queueNumber}&wait=${order.estimatedWaitMinutes}&shop=${encodeURIComponent(shop.name)}`
      );
    } catch (err: any) {
      alert(err.message || 'An error occurred while creating your order.');
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <Link
          href={`/shops/${selectedShopId}`}
          className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <ArrowLeftIcon size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">Confirm Order</h1>
          <p className="text-sm text-[var(--text-muted)]">{shop.name}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Left — Steps and Confirmation */}
        <div className="space-y-5 animate-fade-in-up">
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Finalize Print Order</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Review your documents, page count, and binding options. Once you place the order, it will be added to the print queue of <span className="font-semibold text-[var(--accent)]">{shop.name}</span>.
              </p>
            </div>

            {/* Steps Guide */}
            <div className="border-t border-[var(--border-subtle)] pt-6 space-y-5">
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">How it works</p>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Place Order</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Confirm order details to add your files to the print queue.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Pay at the Counter</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Scan the counter QR code at the shop and make the payment.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Collect Prints</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Collect your printed documents from the counter.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Custom Notes */}
          <Card className="p-6 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Note for Shopkeeper (Optional)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., staple files separately, keep landscape, print page 5 in color..."
              className="w-full min-h-[80px] p-3 text-sm rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all resize-y"
            />
          </Card>

          {/* Place Order Button */}
          <Button
            size="lg"
            fullWidth
            loading={processing}
            onClick={handlePlaceOrder}
            className="shadow-lg"
          >
            Place Order & Get Queue Number
          </Button>
        </div>

        {/* Right — Order Summary */}
        <div className="lg:sticky lg:top-20 lg:self-start animate-slide-in-right">
          <Card>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Order Summary</h3>

            <div className="space-y-3 mb-4">
              {files.map((file, i) => {
                const printCost = calculateFilePrintingCost(file.pages, file.printOptions, shop);
                const extrasCost = calculateExtras(file.printOptions, shop);

                return (
                  <div key={i} className="pb-3 border-b border-[var(--border-subtle)] last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate mb-0.5">{file.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{file.pages} pages · {getPrintDescription(file.printOptions)}</p>
                    <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                      <span>Printing</span>
                      <span>{formatCurrency(printCost)}</span>
                    </div>
                    {extrasCost > 0 && (
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <span>Extras</span>
                        <span>{formatCurrency(extrasCost)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[var(--border)] pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>Printing</span>
                <span>{formatCurrency(printingTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>Binding & Extras</span>
                <span>{formatCurrency(bindingTotal)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[var(--text-primary)] pt-2 border-t border-[var(--border-subtle)]">
                <span>Total Amount</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
