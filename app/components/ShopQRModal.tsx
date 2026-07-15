'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/app/components/ui';
import { XIcon, CopyIcon, QRIcon } from '@/app/components/icons';

interface ShopQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: {
    id: string;
    name: string;
    address: string;
  };
  hideDownload?: boolean;
}

export default function ShopQRModal({ isOpen, onClose, shop, hideDownload = false }: ShopQRModalProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !shop) return;

    setLoading(true);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const shopUrl = `${origin}/shops/${shop.id}`;

    // Simple & High-contrast QR Code options for robust scan reliability
    const qrOptions = {
      errorCorrectionLevel: 'M' as const,
      margin: 1,
      width: 512,
      color: {
        dark: '#111827', // Dark charcoal/black
        light: '#FFFFFF', // Clean white background
      },
    };

    QRCode.toDataURL(shopUrl, qrOptions, (error, url) => {
      if (error) {
        console.error('Failed to generate QR code:', error);
      } else {
        setQrDataUrl(url || '');
      }
      setLoading(false);
    });
  }, [isOpen, shop]);

  const copyShopLink = () => {
    if (!shop) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const shopUrl = `${origin}/shops/${shop.id}`;
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRPoster = () => {
    if (!shop || !qrDataUrl) return;

    // Create a high-res minimalist poster canvas
    const poster = document.createElement('canvas');
    poster.width = 1200;
    poster.height = 1600;
    const ctx = poster.getContext('2d');
    if (!ctx) return;

    // 1. Clean white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1200, 1600);

    // 2. Stylish thin border frame
    ctx.strokeStyle = '#4F46E5'; // Elegant Indigo border line
    ctx.lineWidth = 16;
    ctx.strokeRect(40, 40, 1120, 1520);

    // 3. Header title
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 72px Inter, system-ui, sans-serif';
    ctx.fillText('SCAN TO ORDER', 600, 200);

    // Shop name
    ctx.fillStyle = '#4F46E5';
    ctx.font = 'bold 48px Inter, system-ui, sans-serif';
    ctx.fillText(shop.name.toUpperCase(), 600, 280);

    // Subtitle instructions
    ctx.fillStyle = '#4B5563';
    ctx.font = '500 28px Inter, system-ui, sans-serif';
    ctx.fillText('Scan with your phone camera to place your print order', 600, 350);

    // 4. Central QR code container frame
    const qrFrameX = 300;
    const qrFrameY = 460;
    const qrFrameSize = 600;

    // Clean frame box
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 4;
    ctx.strokeRect(qrFrameX, qrFrameY, qrFrameSize, qrFrameSize);

    // Draw the QR Code image once it loads on the canvas
    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(
        qrImg,
        qrFrameX + 20,
        qrFrameY + 20,
        qrFrameSize - 40,
        qrFrameSize - 40
      );

      // 5. Instruction steps
      const stepYStart = 1180;
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 36px Inter, system-ui, sans-serif';
      ctx.fillText('How it Works:', 600, stepYStart);

      ctx.fillStyle = '#374151';
      ctx.font = '500 26px Inter, system-ui, sans-serif';
      ctx.fillText('1. Scan QR with your phone camera', 600, stepYStart + 70);
      ctx.fillText('2. Upload your documents & select options', 600, stepYStart + 130);
      ctx.fillText('3. Pay securely & collect at the counter', 600, stepYStart + 195);

      // 6. Footer branding
      ctx.fillStyle = '#9CA3AF';
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      ctx.fillText('POWERED BY ORDO', 600, 1490);

      // Trigger download
      const dataUrl = poster.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${shop.name.toLowerCase().replace(/\s+/g, '-')}-qr.png`;
      link.href = dataUrl;
      link.click();
    };
    qrImg.src = qrDataUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm overflow-hidden bg-[var(--surface)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl animate-scale-in text-center p-6 space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer focus:outline-none"
        >
          <XIcon size={16} />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight text-center">
            {shop.name}
          </h3>
          <p className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-1">
            <span>📍 {shop.address}</span>
          </p>
        </div>

        {/* QR Code Container - Simple & Modern */}
        <div className="relative w-52 h-52 mx-auto bg-white p-3 rounded-2xl border border-[var(--border-subtle)] flex items-center justify-center overflow-hidden">
          {qrDataUrl && !loading ? (
            <img src={qrDataUrl} alt="Shop QR Code" className="w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 bg-white flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Scanning tip */}
        <p className="text-xs text-[var(--text-secondary)] px-4 leading-relaxed">
          Scan this QR Code using your phone camera to open this print shop, upload your files, and place orders.
        </p>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {!hideDownload && (
            <Button onClick={downloadQRPoster} fullWidth icon={<QRIcon size={16} />}>
              Download Printable QR Poster
            </Button>
          )}
          <Button variant="secondary" onClick={copyShopLink} fullWidth icon={<CopyIcon size={16} />}>
            {copied ? 'Link Copied!' : 'Copy Shop Link'}
          </Button>
        </div>
      </div>
    </div>
  );
}
