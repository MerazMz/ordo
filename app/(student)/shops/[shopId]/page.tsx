'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { Button, Card, Badge, Skeleton } from '@/app/components/ui';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  StarIcon,
  MapPinIcon,
  QRIcon,
  PrinterIcon,
} from '@/app/components/icons';
import { formatCurrency } from '@/app/lib/utils';
import type { Shop } from '@/app/lib/types';
import ShopQRModal from '@/app/components/ShopQRModal';

export default function PublicShopInfoPage() {
  const params = useParams();
  const shopId = params.shopId as string;

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    async function loadShop() {
      try {
        const response = await fetch('/api/shops');
        const data = await response.json();
        if (data.success) {
          const found = data.data.find((s: Shop) => s.id === shopId);
          if (found) {
            setShop(found);
          }
        }
      } catch (error) {
        console.error('Failed to load shop details:', error);
      } finally {
        setLoading(false);
      }
    }
    loadShop();

    // Set up WebSocket connection for realtime shop updates
    const socket = io();

    socket.on('shop-status-update', ({ shopId: updatedShopId, status }) => {
      if (updatedShopId === shopId) {
        setShop((prevShop) => prevShop ? { ...prevShop, status } : null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [shopId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Shop not found</h2>
        <p className="text-sm text-[var(--text-muted)] mt-2">The requested print shop does not exist or has been removed.</p>
        <Link href="/shops" className="inline-block mt-4">
          <Button variant="secondary">Back to Shops</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Back to list */}
      <div className="flex items-center gap-4 mb-6 animate-fade-in">
        <Link
          href="/shops"
          className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <ArrowLeftIcon size={16} />
        </Link>
        <span className="text-sm font-medium text-[var(--text-secondary)]">Back to Shops list</span>
      </div>

      {/* Shop Hero Card */}
      <Card className="relative overflow-hidden mb-6 animate-fade-in-up">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--accent)] to-[var(--info)]" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{shop.name}</h1>
              <Badge variant={shop.status === 'open' ? 'success' : shop.status === 'busy' ? 'warning' : 'error'} dot>
                {shop.status.charAt(0).toUpperCase() + shop.status.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
              <MapPinIcon size={14} className="text-[var(--text-muted)]" />
              {shop.address}
            </p>
            <div className="flex items-center gap-4 pt-1 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <StarIcon size={12} filled className="text-[var(--warning)]" />
                <strong>{shop.rating}</strong> ({shop.totalRatings} ratings)
              </span>
              <span>•</span>
              <span>📞 {shop.phone}</span>
              <span>•</span>
              <span>🕒 {shop.operatingHoursOpen} - {shop.operatingHoursClose}</span>
            </div>
          </div>
          <button
            onClick={() => setShowQRModal(true)}
            className="self-start md:self-center px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <QRIcon size={14} />
            <span>Show QR Code</span>
          </button>
        </div>
      </Card>

      {/* Closed Shop Alert */}
      {shop.status === 'closed' && (
        <div className="p-4 mb-6 rounded-2xl bg-[var(--error-bg)] border border-[var(--error-border)] text-sm text-[var(--error)] flex items-center gap-3 animate-fade-in">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span className="font-medium">This shop is currently closed. You can view rates but cannot upload files or place orders.</span>
        </div>
      )}

      {/* Grid: Left - Pricing Details, Right - Action Panel */}
      <div className="grid md:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Pricing List */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4 text-left">
              Printing Rates & Prices
            </h3>
            
            <div className="divide-y divide-[var(--border-subtle)] space-y-3.5">
              <div className="flex justify-between items-center pt-3.5 first:pt-0">
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Black & White Print</p>
                  <p className="text-xs text-[var(--text-muted)]">Standard quality text print</p>
                </div>
                <span className="text-sm font-bold text-[var(--text-primary)]">₹{shop.pricePerPageBW} / page</span>
              </div>

              <div className="flex justify-between items-center pt-3.5">
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Color Print</p>
                  <p className="text-xs text-[var(--text-muted)]">High quality photo/graphics print</p>
                </div>
                <span className="text-sm font-bold text-[var(--text-primary)]">₹{shop.pricePerPageColor} / page</span>
              </div>

              {!shop.disabledServices?.includes('bondPaper') && (
                <div className="flex justify-between items-center pt-3.5">
                  <div className="text-left">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Bond Paper</p>
                    <p className="text-xs text-[var(--text-muted)]">Flat rate, single-sided only</p>
                  </div>
                  <span className="text-sm font-bold text-[var(--text-primary)]">₹{shop.bondPaperPrice} / page</span>
                </div>
              )}

              {/* Binding Options */}
              <div className="pt-4 mt-4 border-t border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 text-left">Binding & Finishing Services</p>
                
                <div className="space-y-2 text-xs">
                  {!shop.disabledServices?.includes('staple') && (
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Standard Staple</span>
                      <span className="font-medium text-[var(--text-primary)]">₹{shop.staplePrice}</span>
                    </div>
                  )}
                  {!shop.disabledServices?.includes('spiralBinding') && (
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Spiral Binding</span>
                      <span className="font-medium text-[var(--text-primary)]">₹{shop.spiralPrice}</span>
                    </div>
                  )}
                  {!shop.disabledServices?.includes('lamination') && (
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Plastic Lamination</span>
                      <span className="font-medium text-[var(--text-primary)]">₹{shop.laminationPrice}</span>
                    </div>
                  )}
                  {shop.bindingPrice > 0 && (
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Book Binding / Hardcover</span>
                      <span className="font-medium text-[var(--text-primary)]">₹{shop.bindingPrice}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Services */}
              {shop.customServices && shop.customServices.length > 0 && (
                <div className="pt-4 mt-4 border-t border-[var(--border)]">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 text-left">Custom Services</p>
                  <div className="space-y-2 text-xs">
                    {shop.customServices.map((service) => (
                      <div key={service.id} className="flex justify-between text-[var(--text-secondary)]">
                        <span>{service.name}</span>
                        <span className="font-medium text-[var(--text-primary)]">₹{service.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Action Panel */}
        <div className="space-y-4">
          <Card className="text-center bg-[var(--surface-hover)] border-2 border-[var(--accent-subtle)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center mx-auto mb-3">
              <PrinterIcon size={18} className="text-[var(--text-secondary)]" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Ready to Print?</h4>
            <p className="text-xs text-[var(--text-muted)] mb-5 leading-relaxed">
              Continue to upload your documents, configure copies, margins, sides, and submit to the queue.
            </p>

            {shop.status === 'closed' ? (
              <Button size="lg" fullWidth disabled>
                Shop is Closed
              </Button>
            ) : (
              <Link href={`/shops/${shopId}/print`} className="block">
                <Button size="lg" fullWidth>
                  Start Printing
                  <ArrowRightIcon size={14} />
                </Button>
              </Link>
            )}
          </Card>

          {/* Quick Guide */}
          <Card>
            <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3 text-left">How to place order</h4>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] text-left list-decimal pl-4">
              <li>Click <strong>Start Printing</strong></li>
              <li>Log in or register your account</li>
              <li>Upload your documents & specify page options</li>
              <li>Submit order & collect printouts at counter</li>
            </ul>
          </Card>
        </div>
      </div>

      <ShopQRModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} shop={shop} hideDownload={true} />
    </div>
  );
}
