'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Badge, Skeleton } from '@/app/components/ui';
import { ArrowLeftIcon } from '@/app/components/icons';
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

export default function ShopPricingPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'printing' | 'binding' | 'finishing'>('printing');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Swipe gesture hooks
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

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
  }, [shopId]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const tabs: ('printing' | 'binding' | 'finishing')[] = ['printing', 'binding', 'finishing'];
    const currentIndex = tabs.indexOf(activeTab);

    if (isLeftSwipe && currentIndex < tabs.length - 1) {
      // Swipe left, load next tab
      setActiveTab(tabs[currentIndex + 1]);
    } else if (isRightSwipe && currentIndex > 0) {
      // Swipe right, load previous tab
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Shop not found</h2>
        <p className="text-sm text-[var(--text-muted)] mt-2">The requested print shop does not exist.</p>
        <Link href="/shops" className="inline-block mt-4">
          <Button variant="secondary">Back to Shops</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Sticky Top Header Bar (Consistent with Shop Details Page Header) */}
      <div className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border-subtle)]/45 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-md mx-auto flex items-center justify-between px-6">
          <button
            onClick={() => router.push(`/shops/${shopId}`)}
            className="w-10 h-10 flex items-center justify-start text-[var(--text-primary)] hover:opacity-75 transition-opacity cursor-pointer focus:outline-none"
            aria-label="Back"
          >
            <BoldArrowLeftIcon size={20} />
          </button>
          <div className='flex justify-between font-bold'>
            Services
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-10 h-10 flex items-center justify-end transition-all cursor-pointer focus:outline-none
                ${isFavorite ? 'text-red-500 scale-105' : 'text-[var(--text-primary)] hover:opacity-75'}`}
              aria-label="Favorite"
            >
              <BoldHeartIcon size={20} className={isFavorite ? 'fill-currentColor' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Page Body with Touch Gestures enabled */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="max-w-md mx-auto px-6 py-5 pb-36 space-y-6 animate-fade-in text-left min-h-[450px]"
      >
        {/* Pill Tab Selector */}
        <div className="bg-[var(--surface-hover)] p-1 rounded-full flex items-center justify-between border border-[var(--border-subtle)]">
          {(['printing', 'binding', 'finishing'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-semibold rounded-full capitalize transition-all cursor-pointer focus:outline-none text-center
                  ${isActive
                    ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]/40 font-bold scale-[1.02]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Tab 1: Printing tab */}
          {activeTab === 'printing' && (
            <div className="space-y-5 animate-fade-in">
              {/* PRINTING RATES SECTION */}
              <div>
                <h2 className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-3 text-left">
                  Printing Rates
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-[var(--border-subtle)]/50">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">Black & White</h3>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Standard quality text print</p>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">₹{shop.pricePerPageBW.toFixed(0)} / page</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-[var(--border-subtle)]/50">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">Color Print</h3>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">High quality photo/graphics</p>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">₹{shop.pricePerPageColor.toFixed(0)} / page</span>
                  </div>

                  {!shop.disabledServices?.includes('bondPaper') && (
                    <div className="flex justify-between items-center pb-3 border-b border-[var(--border-subtle)]/50">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Bond Paper</h3>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Flat rate, single-sided</p>
                      </div>
                      <span className="text-sm font-bold text-[var(--text-primary)]">₹{shop.bondPaperPrice.toFixed(0)} / page</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Binding Tab */}
          {activeTab === 'binding' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-3 text-left">
                Binding Services
              </h2>
              
              <div className="space-y-4">
                {!shop.disabledServices?.includes('spiralBinding') && (
                  <div className="flex justify-between items-center pb-3 border-b border-[var(--border-subtle)]/50">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">Spiral Binding</h3>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Flexible wire spiral protective binding</p>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">₹{shop.spiralPrice}</span>
                  </div>
                )}

                {shop.bindingPrice > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-[var(--border-subtle)]/50">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">Book Binding</h3>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Premium hardcover thesis binding</p>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">₹{shop.bindingPrice}</span>
                  </div>
                )}

                {!shop.disabledServices?.includes('staple') && (
                  <div className="flex justify-between items-center pb-3 border-b border-[var(--border-subtle)]/50">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">Standard Staple</h3>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Standard corner wire staples</p>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">₹{shop.staplePrice}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Finishing Tab */}
          {activeTab === 'finishing' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-3 text-left">
                Finishing Services
              </h2>

              <div className="space-y-4">
                {!shop.disabledServices?.includes('lamination') && (
                  <div className="flex justify-between items-center pb-3 border-b border-[var(--border-subtle)]/50">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">Plastic Lamination</h3>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Glossy water-proof thermal lamination sheet</p>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">₹{shop.laminationPrice}</span>
                  </div>
                )}

                {/* Custom Services */}
                {shop.customServices && shop.customServices.length > 0 ? (
                  shop.customServices.map((service) => (
                    <div key={service.id} className="flex justify-between items-center pb-3 border-b border-[var(--border-subtle)]/50">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">{service.name}</h3>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Custom utility finish</p>
                      </div>
                      <span className="text-sm font-bold text-[var(--text-primary)]">₹{service.price}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-xl">
                    No additional custom finishing services registered.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Actions Bar (Floats above bottom navbar) */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-transparent pt-6 pb-5 px-6 border-t border-[var(--border-subtle)]/30">
        <div className="max-w-md mx-auto">
          {shop.status === 'closed' ? (
            <Button size="lg" fullWidth disabled className="rounded-[16px] h-12 text-xs">
              Shop is Closed
            </Button>
          ) : (
            <Link href={`/shops/${shopId}/print`} className="block w-full">
              <Button size="lg" fullWidth className="bg-black hover:bg-neutral-900 text-white rounded-[16px] h-12 text-xs font-semibold">
                Start Printing
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* QR Code Modal Display */}
      <ShopQRModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} shop={shop} hideDownload={true} />
    </div>
  );
}
