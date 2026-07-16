'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Badge, Input, Skeleton, EmptyState } from '@/app/components/ui';
import { SearchIcon, StarIcon, ClockIcon, QueueIcon, MapPinIcon, ShopIcon, ArrowRightIcon } from '@/app/components/icons';
import { formatWaitTime } from '@/app/lib/utils';
import type { Shop } from '@/app/lib/types';

interface MobileShopsViewProps {
  shops: Shop[];
  loading: boolean;
  search: string;
  setSearch: (val: string) => void;
  filteredShops: Shop[];
}

export default function MobileShopsView({
  shops,
  loading,
  search,
  setSearch,
  filteredShops,
}: MobileShopsViewProps) {
  return (
    <div className="max-w-md mx-auto px-6 py-6 pb-24 text-left">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight mb-1">
          Print Shops
        </h1>
        <p className="text-xs text-[var(--text-secondary)]">
          Select a nearby printing counter
        </p>
      </div>

      {/* Search */}
      <div className="mb-5 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        <Input
          placeholder="Search location or shop name..."
          icon={<SearchIcon size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading || shops.length === 0}
        />
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 space-y-4 rounded-[24px]">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/2 rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </Card>
          ))}
        </div>
      ) : shops.length === 0 ? (
        <EmptyState
          icon={<ShopIcon size={32} />}
          title="No shops registered"
          description="There are currently no print shops registered on the platform."
        />
      ) : filteredShops.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={32} />}
          title="No matching shops found"
          description={`We couldn't find any print shops matching "${search}".`}
        />
      ) : (
        /* Mobile Shop Card Stack */
        <div className="space-y-4">
          {filteredShops.map((shop) => (
            <Link key={shop.id} href={`/shops/${shop.id}`} className="block">
              <Card hover className="group relative overflow-hidden bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[24px] p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md">
                <div className="space-y-3.5">
                  {/* Status indicator */}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors uppercase tracking-wide truncate">
                          {shop.name}
                        </h3>
                        {shop.isVerified && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--info)" className="flex-shrink-0">
                            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-1.5 truncate">
                        <MapPinIcon size={12} className="text-[var(--text-muted)] flex-shrink-0" />
                        <span className="truncate">{shop.address}</span>
                      </div>
                    </div>

                    <Badge
                      variant={shop.status === 'open' ? 'success' : shop.status === 'busy' ? 'warning' : 'error'}
                      dot
                      className="flex-shrink-0 text-[10px]"
                    >
                      {shop.status === 'open' ? 'Open' : shop.status === 'busy' ? 'Busy' : 'Closed'}
                    </Badge>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-[11px] text-[var(--text-secondary)] py-0.5">
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <StarIcon size={13} filled className="text-[var(--warning)]" />
                      <span className="font-semibold text-[var(--text-primary)]">{shop.rating.toFixed(1)}</span>
                      <span className="text-[var(--text-muted)]">({shop.totalRatings})</span>
                    </div>

                    {/* Queue */}
                    <div className="flex items-center gap-1">
                      <QueueIcon size={13} className="text-[var(--text-muted)]" />
                      <span>{shop.queueLength} in queue</span>
                    </div>

                    {/* Wait Time */}
                    <div className="flex items-center gap-1">
                      <ClockIcon size={13} className="text-[var(--text-muted)]" />
                      <span>
                        ~{shop.status === 'closed' ? 'Closed' : formatWaitTime(shop.estimatedWaitMinutes)}
                      </span>
                    </div>
                  </div>

                  {/* Services Row */}
                  <div className="flex items-center flex-wrap gap-1">
                    {(() => {
                      const services = ['B&W', 'Color'];
                      if (shop.spiralPrice > 0) services.push('Spiral Binding');
                      if (shop.laminationPrice > 0) services.push('Lamination');
                      
                      const visibleServices = services.slice(0, 3);
                      const extraCount = services.length - 3;
                      
                      return (
                        <>
                          {visibleServices.map((srv, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-[9px] font-medium rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]/30">
                              {srv}
                            </span>
                          ))}
                          {extraCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border-subtle)]/30">
                              +{extraCount}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Price hint */}
                <div className="flex items-center justify-between text-[11px] pt-1 mt-3.5 border-t border-[var(--border-subtle)]/65">
                  <span className="text-[var(--text-muted)]">
                    From ₹{shop.pricePerPageBW}/page (B&W)
                  </span>
                  <span className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-1 cursor-pointer">
                    <span>View Shop</span>
                    <ArrowRightIcon size={12} />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
