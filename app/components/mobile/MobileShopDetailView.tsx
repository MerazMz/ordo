'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Badge } from '@/app/components/ui';
import { StarIcon, MapPinIcon, ClockIcon } from '@/app/components/icons';
import type { Shop } from '@/app/lib/types';
import ShopQRModal from '@/app/components/ShopQRModal';

// Custom icons with normal strokeWidth 1.8 and no borders
function BoldArrowLeftIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function BoldShareIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function BoldHeartIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function formatTime12(timeStr: string): string {
  if (!timeStr) return '';
  try {
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const paddedHours = displayHours < 10 ? `0${displayHours}` : displayHours;
    const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${paddedHours}:${paddedMinutes} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
}

interface MobileShopDetailViewProps {
  shop: Shop;
}

export default function MobileShopDetailView({ shop }: MobileShopDetailViewProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const handleShareClick = () => {
    setShowQRModal(true);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Sticky Top Header Bar */}
      <div className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border-subtle)]/45 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="relative max-w-md mx-auto flex items-center justify-between px-4 h-12">
          {/* Left Button */}
          <button
            onClick={() => router.push('/shops')}
            className="w-9 h-9 flex items-center justify-center text-[var(--text-primary)] hover:opacity-75 transition-opacity cursor-pointer focus:outline-none"
            aria-label="Back"
          >
            <BoldArrowLeftIcon size={20} />
          </button>

          {/* Center Title */}
          <div className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
            Shop Info
          </div>

          {/* Right Buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleShareClick}
              className="w-9 h-9 flex items-center justify-center text-[var(--text-primary)] hover:opacity-75 transition-opacity cursor-pointer focus:outline-none"
              aria-label="Show Shop QR Code"
            >
              <BoldShareIcon size={20} />
            </button>

            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-9 h-9 flex items-center justify-center transition-all cursor-pointer focus:outline-none ${
                isFavorite ? 'text-red-500 scale-105' : 'text-[var(--text-primary)] hover:opacity-75'
              }`}
              aria-label="Favorite"
            >
              <BoldHeartIcon size={20} className={isFavorite ? 'fill-current' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Page Body */}
      <div className="max-w-md mx-auto px-6 py-4 pb-36 space-y-5 animate-fade-in text-left">
        {/* Storefront Image — Renders only if imageUrl is defined */}
        {shop.imageUrl && (
          <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden shadow-sm border border-[var(--border-subtle)] animate-fade-in-up">
            <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Info Block */}
        <div className="text-left space-y-4">
          {/* Name and status */}
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight uppercase max-w-[280px] break-words">
              {shop.name}
            </h1>
            <Badge
              variant={shop.status === 'open' ? 'success' : shop.status === 'busy' ? 'warning' : 'error'}
              dot
              className="mt-1 text-[10px]"
            >
              {shop.status === 'open' ? 'Open' : shop.status === 'busy' ? 'Busy' : 'Closed'}
            </Badge>
          </div>

          {/* Location address */}
          <div className="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]">
            <MapPinIcon size={15} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
            <span>{shop.address}</span>
          </div>

          {/* Rating and Phone details */}
          <div className="flex items-center gap-6 text-[13px] text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <StarIcon size={15} filled className="text-[var(--warning)]" />
              <span className="font-semibold text-[var(--text-primary)]">{shop.rating.toFixed(1)}</span>
              <span className="text-[var(--text-muted)]">({shop.totalRatings})</span>
            </div>

            <div className="flex items-center gap-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[var(--text-muted)]">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span className="text-[var(--text-primary)] font-medium">{shop.phone}</span>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)] pb-1">
            <ClockIcon size={15} className="text-[var(--text-muted)] flex-shrink-0" />
            <span>{formatTime12(shop.operatingHoursOpen)} - {formatTime12(shop.operatingHoursClose)}</span>
          </div>
        </div>

        {/* Feature Icons Row */}
        <div className="grid grid-cols-3 gap-2 py-4 border-y border-[var(--border-subtle)] text-center text-[10px] text-[var(--text-secondary)]">
          <div className="flex flex-col items-center gap-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[var(--text-secondary)]">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="font-semibold">Fast Service</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[var(--text-secondary)]">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="font-semibold">Quality Prints</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[var(--text-secondary)]">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="font-semibold">Secure & Trusted</span>
          </div>
        </div>

        {/* Live Queue Status Card */}
        <div className="p-4 rounded-[20px] bg-[var(--surface-hover)] flex items-center justify-between border border-[var(--border-subtle)] text-left">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[var(--text-primary)]">
              {shop.queueLength === 0 ? "No wait time" : `~${shop.estimatedWaitMinutes} min wait`}
            </h4>
            <p className="text-xs text-[var(--text-muted)]">
              {shop.queueLength === 0 ? "Be the first in queue!" : `${shop.queueLength} order(s) ahead of you`}
            </p>
          </div>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-amber-700/80">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>

        {/* QR Code Modal Display */}
        <ShopQRModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} shop={shop} hideDownload={true} />
      </div>

      {/* Sticky Bottom Actions Bar (Floats above bottom navbar) */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-transparent pt-6 pb-5 px-6 border-t border-[var(--border-subtle)]/30">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href={`/shops/${shop.id}/pricing`} className="flex-1">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              className="rounded-[16px] h-12 text-xs font-semibold cursor-pointer bg-[var(--surface)]"
            >
              View Services
            </Button>
          </Link>

          {shop.status === 'closed' ? (
            <Button size="lg" className="flex-1 rounded-[16px] h-12 text-xs font-semibold" disabled>
              Shop is Closed
            </Button>
          ) : (
            <Link href={`/shops/${shop.id}/print`} className="flex-1">
              <Button size="sm" fullWidth className="bg-black hover:bg-neutral-900 text-white rounded-[16px] h-12 text-xs font-semibold">
                Start Printing
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
