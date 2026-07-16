'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, Skeleton } from '@/app/components/ui';
import { QRIcon, MapPinIcon, StarIcon, ArrowRightIcon } from '@/app/components/icons';
import type { Shop } from '@/app/lib/types';

export default function MobileUploadPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);

  // Fetch shops
  useEffect(() => {
    async function loadShops() {
      try {
        const res = await fetch('/api/shops');
        const data = await res.json();
        if (data.success) {
          setShops(data.data.filter((s: Shop) => s.status !== 'closed'));
        }
      } catch (e) {
        console.error('Failed to load shops:', e);
      } finally {
        setLoading(false);
      }
    }
    loadShops();
  }, []);

  // HTML5 QR Code Scanner Lifecycle
  useEffect(() => {
    let activeScanner: any = null;

    async function startScanner() {
      if (isScanning) {
        setScannerError(null);
        try {
          const { Html5Qrcode } = await import('html5-qrcode');
          const scanner = new Html5Qrcode("qr-reader");
          activeScanner = scanner;

          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 }
            },
            async (decodedText) => {
              try {
                await scanner.stop();
                const match = decodedText.match(/\/shops\/([a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                  const scannedShopId = match[1];
                  router.push(`/shops/${scannedShopId}/print`);
                } else {
                  alert("Invalid QR Code scanned. Please scan an Ordo Shop QR poster.");
                  setIsScanning(false);
                }
              } catch (e) {
                console.error("Error stopping scanner after decode:", e);
              }
            },
            (error) => {
              // Ignore constant parsing failures
            }
          );
        } catch (err: any) {
          console.error("Scanner failed to start:", err);
          setScannerError("Camera permission denied or camera not available.");
          setIsScanning(false);
        }
      }
    }

    startScanner();

    return () => {
      if (activeScanner && activeScanner.isScanning) {
        activeScanner.stop().catch((e: any) => console.error("Scanner cleanup stop failed:", e));
      }
    };
  }, [isScanning, router]);

  const handleProceed = () => {
    if (selectedShopId) {
      router.push(`/shops/${selectedShopId}/print`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl animate-pulse" />
        <Skeleton className="h-40 w-full rounded-2xl animate-pulse" />
      </div>
    );
  }

  const selectedShop = shops.find(s => s.id === selectedShopId);

  return (
    <div className="max-w-md mx-auto px-6 py-6 pb-24 space-y-6 animate-fade-in">
      {/* Viewfinder Card */}
      <Card className="p-0 overflow-hidden relative border-2 border-[var(--border-strong)] bg-black h-64 rounded-2xl flex flex-col items-center justify-center text-center text-white">
        {isScanning ? (
          <div className="w-full h-full relative">
            {/* HTML5 QR reader target */}
            <div id="qr-reader" className="w-full h-full object-cover" />
            
            {/* Overlay indicators */}
            <div className="absolute inset-0 border-[3px] border-[var(--accent)] border-t-transparent border-b-transparent animate-pulse rounded-2xl pointer-events-none" />
            
            <button
              onClick={() => setIsScanning(false)}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer"
            >
              Cancel Scan
            </button>
          </div>
        ) : (
          <>
            {/* Decorative corner lines */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-md" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-md" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-md" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-md" />

            <div className="relative w-24 h-24 border border-white/20 rounded-2xl flex items-center justify-center mb-3">
              <div className="absolute inset-0 bg-white/5 rounded-2xl" />
              <QRIcon size={36} className="text-white/80" />
            </div>

            <p className="text-sm font-semibold tracking-tight text-white/90">Scan Shop QR Code</p>
            <p className="text-xs text-white/60 mt-1 mb-4 max-w-[220px]">
              Allows direct camera scanning to identify college print shops.
            </p>

            <button
              onClick={() => setIsScanning(true)}
              className="px-5 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-100 transition-colors cursor-pointer flex items-center gap-2 focus:outline-none"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Activate Camera</span>
            </button>
          </>
        )}

        {scannerError && (
          <div className="absolute inset-x-4 bottom-4 p-2 rounded-xl bg-red-600/90 text-[11px] text-white font-medium animate-fade-in">
            ⚠️ {scannerError}
          </div>
        )}
      </Card>

      {/* Manual Select Card */}
      <Card className="text-left space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Select Print Shop manually</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Can't scan the QR? Choose from nearby open shops.
          </p>
        </div>

        <div className="space-y-3">
          {shops.length === 0 ? (
            <div className="p-3 text-center border border-[var(--border)] rounded-xl bg-[var(--surface-hover)] text-xs text-[var(--text-muted)]">
              No open shops available at the moment.
            </div>
          ) : (
            <>
              <div className="relative">
                <select
                  value={selectedShopId}
                  onChange={(e) => {
                    setSelectedShopId(e.target.value);
                    setIsScanning(false);
                  }}
                  className="w-full h-11 px-3 text-sm rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all cursor-pointer appearance-none"
                >
                  <option value="">-- Choose a Print Shop --</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name} ({shop.address})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {selectedShop && (
                <div className="p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] space-y-2 animate-fade-in text-xs text-[var(--text-secondary)]">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[var(--text-primary)]">{selectedShop.name}</span>
                    <Badge variant={selectedShop.status === 'open' ? 'success' : 'warning'}>
                      {selectedShop.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <MapPinIcon size={12} />
                    <span>{selectedShop.address}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[var(--text-muted)] mt-1">
                    <span className="flex items-center gap-0.5">
                      <StarIcon size={11} filled className="text-[var(--warning)]" />
                      <strong>{selectedShop.rating}</strong>
                    </span>
                    <span>⌛ ~{selectedShop.estimatedWaitMinutes}m wait</span>
                  </div>
                </div>
              )}

              <Button
                size="lg"
                fullWidth
                disabled={!selectedShopId}
                onClick={handleProceed}
                className="mt-2"
              >
                <span>Proceed to Print Options</span>
                <ArrowRightIcon size={16} />
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
