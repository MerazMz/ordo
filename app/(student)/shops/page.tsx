'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { Card, Badge, Input, Skeleton, EmptyState } from '@/app/components/ui';
import { SearchIcon, StarIcon, ClockIcon, QueueIcon, MapPinIcon, ShopIcon } from '@/app/components/icons';
import { cn, formatWaitTime } from '@/app/lib/utils';
import type { Shop } from '@/app/lib/types';

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadShops() {
      try {
        const response = await fetch('/api/shops');
        const data = await response.json();
        if (data.success) {
          setShops(data.data);
        }
      } catch (error) {
        console.error('Failed to load shops:', error);
      } finally {
        setLoading(false);
      }
    }
    loadShops();

    // Connect to Socket.io for realtime shop status updates
    const socket = io();

    socket.on('shop-status-update', ({ shopId, status }) => {
      setShops((prevShops) =>
        prevShops.map((shop) =>
          shop.id === shopId ? { ...shop, status } : shop
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredShops = shops.filter((shop) =>
    shop.name.toLowerCase().includes(search.toLowerCase()) ||
    shop.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1">
          Nearby Print Shops
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Choose a shop to start your print order
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        <Input
          placeholder="Search shops by name or location..."
          icon={<SearchIcon size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading || shops.length === 0}
        />
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-8 w-full rounded-xl" />
            </Card>
          ))}
        </div>
      ) : shops.length === 0 ? (
        <EmptyState
          icon={<ShopIcon size={32} />}
          title="No shops registered yet"
          description="There are currently no print shops registered on the platform. Log in as an administrator to register your first print shop."
          action={
            <Link href="/login">
              <Badge variant="info" className="px-4 py-2 text-sm cursor-pointer hover:opacity-90">
                Log in as Admin
              </Badge>
            </Link>
          }
        />
      ) : filteredShops.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={32} />}
          title="No matching shops found"
          description={`We couldn't find any print shops matching "${search}". Try searching for another keyword.`}
        />
      ) : (
        /* Shop Grid */
        <div className="grid md:grid-cols-2 gap-4 stagger-children">
          {filteredShops.map((shop) => (
            <Link key={shop.id} href={`/shops/${shop.id}`}>
              <Card hover className="group relative overflow-hidden">
                {/* Status indicator */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                        {shop.name}
                      </h3>
                      {shop.isVerified && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--info)" className="flex-shrink-0">
                          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <MapPinIcon size={12} />
                      {shop.address}
                    </div>
                  </div>

                  <Badge
                    variant={shop.status === 'open' ? 'success' : shop.status === 'busy' ? 'warning' : 'error'}
                    dot
                  >
                    {shop.status === 'open' ? 'Open' : shop.status === 'busy' ? 'Busy' : 'Closed'}
                  </Badge>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-4">
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <StarIcon size={14} filled className="text-[var(--warning)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">{shop.rating}</span>
                    <span className="text-xs text-[var(--text-muted)]">({shop.totalRatings})</span>
                  </div>

                  <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />

                  {/* Queue */}
                  <div className="flex items-center gap-1.5">
                    <QueueIcon size={14} className="text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-secondary)]">
                      {shop.queueLength} in queue
                    </span>
                  </div>

                  <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />

                  {/* Wait Time */}
                  <div className="flex items-center gap-1.5">
                    <ClockIcon size={14} className="text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-secondary)]">
                      {shop.status === 'closed' ? 'Closed' : `~${formatWaitTime(shop.estimatedWaitMinutes)}`}
                    </span>
                  </div>
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-[var(--surface-hover)] text-[var(--text-muted)]">B&W Printing</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-[var(--surface-hover)] text-[var(--text-muted)]">Color Printing</span>
                  {shop.spiralPrice > 0 && <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-[var(--surface-hover)] text-[var(--text-muted)]">Spiral Binding</span>}
                  {shop.laminationPrice > 0 && <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-[var(--surface-hover)] text-[var(--text-muted)]">Lamination</span>}
                </div>

                {/* Price hint */}
                <div className={cn(
                  'mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between',
                )}>
                  <span className="text-xs text-[var(--text-muted)]">
                    From ₹{shop.pricePerPageBW}/page (B&W)
                  </span>
                  <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-1">
                    Select Shop →
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
