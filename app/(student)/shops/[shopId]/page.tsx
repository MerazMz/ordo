'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { Button, Card, Badge, Toggle, Skeleton } from '@/app/components/ui';
import {
  UploadIcon,
  FileIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  MinusIcon,
  StarIcon,
  MapPinIcon,
  ImageIcon,
  QRIcon,
} from '@/app/components/icons';
import { cn, formatFileSize, formatCurrency } from '@/app/lib/utils';
import { calculateFilePrintingCost, calculateExtras, getPrintDescription, getExtrasDescription } from '@/app/lib/pricing';
import type { PrintOptions, PrintColor, PrintSide, PaperSize, Orientation, Shop } from '@/app/lib/types';
import { useUpload } from '@/app/lib/store';
import ShopQRModal from '@/app/components/ShopQRModal';

interface LocalFile {
  id: string;
  name: string;
  size: number;
  type: string;
  pages: number;
  preview?: string;
  printOptions: PrintOptions;
}

const defaultPrintOptions: PrintOptions = {
  color: 'bw',
  side: 'single',
  copies: 1,
  copiesBW: 1,
  copiesColor: 0,
  pageRange: 'all',
  paperSize: 'A4',
  orientation: 'portrait',
  staple: false,
  spiralBinding: false,
  lamination: false,
  bondPaper: false,
};

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;
  const { files, addFile, removeFile, updateFileOptions, clearFiles, setSelectedShopId, notes, setNotes } = useUpload();

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch shop details from database
  useEffect(() => {
    async function loadShop() {
      try {
        const response = await fetch('/api/shops');
        const data = await response.json();
        if (data.success) {
          const found = data.data.find((s: Shop) => s.id === shopId);
          if (found) {
            setShop(found);
            setSelectedShopId(shopId);
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
  }, [shopId, setSelectedShopId]);

  // Set first file as selected if any exist and none selected
  useEffect(() => {
    if (files.length > 0 && !selectedFileId) {
      setSelectedFileId(files[0].id);
    }
  }, [files, selectedFileId]);

  // Add files from file input or drag
  const addFiles = useCallback(async (fileList: FileList) => {
    const fileArray = Array.from(fileList);
    
    const convertToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
    };

    for (const file of fileArray) {
      let pages = 1;
      if (file.type === 'application/pdf') {
        const { getPdfPageCount } = await import('@/app/lib/utils');
        pages = await getPdfPageCount(file);
      }

      let fileData: string | undefined;
      try {
        fileData = await convertToBase64(file);
      } catch (err) {
        console.error('Failed to convert file to base64:', err);
      }
      
      addFile({
        name: file.name,
        size: file.size,
        type: file.type,
        pages,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        fileData,
      });
    }
  }, [addFile]);

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
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

  // Calculate prices using DB-defined parameters
  const calculateFileTotal = (file: any) => {
    const printCost = calculateFilePrintingCost(file.pages, file.printOptions, shop);
    const extrasCost = calculateExtras(file.printOptions, shop);
    return printCost + extrasCost;
  };

  const totalAmount = files.reduce((sum, f) => sum + calculateFileTotal(f), 0);
  const totalPrintingCost = files.reduce(
    (sum, f) => sum + calculateFilePrintingCost(f.pages, f.printOptions, shop),
    0
  );
  const totalExtras = files.reduce(
    (sum, f) => sum + calculateExtras(f.printOptions, shop),
    0
  );

  const selectedFile = files.find((f) => f.id === selectedFileId);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Back + Shop Info */}
      <div className="flex items-center gap-4 mb-6 animate-fade-in">
        <Link
          href="/shops"
          className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <ArrowLeftIcon size={16} />
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">{shop.name}</h1>
              <Badge variant={shop.status === 'open' ? 'success' : shop.status === 'busy' ? 'warning' : 'error'} dot>
                {shop.status.charAt(0).toUpperCase() + shop.status.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1"><MapPinIcon size={11} /> {shop.address}</span>
              <span className="flex items-center gap-1"><StarIcon size={11} filled className="text-[var(--warning)]" /> {shop.rating}</span>
            </div>
          </div>
          <button
            onClick={() => setShowQRModal(true)}
            className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <QRIcon size={14} />
            <span>Shop QR</span>
          </button>
        </div>
      </div>

      {/* Closed Shop Warning Alert */}
      {shop.status === 'closed' && (
        <div className="p-4 mb-6 rounded-2xl bg-[var(--error-bg)] border border-[var(--error-border)] text-sm text-[var(--error)] animate-fade-in flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span className="font-medium">This shop is currently closed. You cannot place new orders at this time.</span>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Left Column — Upload & Options */}
        <div className="space-y-5 animate-fade-in-up">
          {/* Upload Zone */}
          <Card padding="none">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'p-8 border-2 border-dashed rounded-2xl m-1 cursor-pointer transition-all duration-200',
                'flex flex-col items-center justify-center text-center',
                dragActive
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                  : 'border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors',
                dragActive ? 'bg-[var(--accent)] text-[var(--text-inverse)]' : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
              )}>
                <UploadIcon size={22} />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                {dragActive ? 'Drop files here' : 'Drop files here or click to upload'}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                PDF, JPG, PNG supported • Max 50 MB per file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
            </div>
          </Card>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[var(--text-primary)]">
                  Uploaded Files ({files.length})
                </h3>
              </div>

              {files.map((file) => (
                <Card
                  key={file.id}
                  hover
                  padding="sm"
                  className={cn(
                    'cursor-pointer',
                    selectedFileId === file.id && 'ring-2 ring-[var(--accent)] border-[var(--accent)]'
                  )}
                  onClick={() => setSelectedFileId(file.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center flex-shrink-0">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon size={18} className="text-[var(--text-secondary)]" />
                      ) : (
                        <FileIcon size={18} className="text-[var(--text-secondary)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span>{file.pages} {file.pages === 1 ? 'page' : 'pages'}</span>
                        <span>•</span>
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{getPrintDescription(file.printOptions)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {formatCurrency(calculateFileTotal(file))}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--error-bg)] hover:text-[var(--error)] transition-colors cursor-pointer"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Print Options for Selected File */}
          {selectedFile && (
            <Card className="animate-fade-in-up">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                Print Options — {selectedFile.name}
              </h3>
              <div className="space-y-5">
                {/* Side */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block text-left">
                    Print Side
                  </label>
                  <div className="flex gap-2">
                    {(['single', 'double'] as PrintSide[]).map((opt) => {
                      const isDisabled = opt === 'double' && selectedFile.printOptions.bondPaper;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (isDisabled) return;
                            updateFileOptions(selectedFile.id, { side: opt });
                          }}
                          className={cn(
                            'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border',
                            isDisabled
                              ? 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border-subtle)] opacity-40 cursor-not-allowed'
                              : selectedFile.printOptions.side === opt
                                ? 'bg-[var(--accent)] text-[var(--text-inverse)] border-[var(--accent)] cursor-pointer'
                                : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)] cursor-pointer'
                          )}
                        >
                          {opt === 'single' ? 'Single Side' : 'Double Side'}
                        </button>
                      );
                    })}
                  </div>
                  {selectedFile.printOptions.bondPaper && (
                    <p className="text-[10px] text-[var(--text-muted)] mt-1.5 text-left">
                      ℹ️ Bond paper is restricted to single-sided printing only.
                    </p>
                  )}
                </div>

                {/* Copies Configuration */}
                {selectedFile.printOptions.bondPaper ? (
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block text-left">
                      Bond Paper Copies (₹{shop.bondPaperPrice}/pg)
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const newCopies = Math.max(1, selectedFile.printOptions.copiesBW - 1);
                          updateFileOptions(selectedFile.id, {
                            copiesBW: newCopies,
                            copiesColor: 0,
                            copies: newCopies,
                            color: 'bw'
                          });
                        }}
                        className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                        type="button"
                      >
                        <MinusIcon size={14} />
                      </button>
                      <span className="w-12 text-center text-lg font-semibold text-[var(--text-primary)]">
                        {selectedFile.printOptions.copiesBW}
                      </span>
                      <button
                        onClick={() => {
                          const newCopies = selectedFile.printOptions.copiesBW + 1;
                          updateFileOptions(selectedFile.id, {
                            copiesBW: newCopies,
                            copiesColor: 0,
                            copies: newCopies,
                            color: 'bw'
                          });
                        }}
                        className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                        type="button"
                      >
                        <PlusIcon size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block text-left">
                        B&W Copies (₹{shop.pricePerPageBW}/pg)
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const newBW = Math.max(0, selectedFile.printOptions.copiesBW - 1);
                            if (newBW === 0 && selectedFile.printOptions.copiesColor === 0) return;
                            const newColor = selectedFile.printOptions.copiesColor;
                            const total = newBW + newColor;
                            const colorType = newColor > 0 ? (newBW > 0 ? 'mixed' : 'color') : 'bw';
                            
                            updateFileOptions(selectedFile.id, {
                              copiesBW: newBW,
                              copies: total,
                              color: colorType
                            });
                          }}
                          className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                          type="button"
                        >
                          <MinusIcon size={14} />
                        </button>
                        <span className="w-12 text-center text-lg font-semibold text-[var(--text-primary)]">
                          {selectedFile.printOptions.copiesBW}
                        </span>
                        <button
                          onClick={() => {
                            const newBW = selectedFile.printOptions.copiesBW + 1;
                            const newColor = selectedFile.printOptions.copiesColor;
                            const total = newBW + newColor;
                            const colorType = newColor > 0 ? (newBW > 0 ? 'mixed' : 'color') : 'bw';
                            
                            updateFileOptions(selectedFile.id, {
                              copiesBW: newBW,
                              copies: total,
                              color: colorType
                            });
                          }}
                          className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                          type="button"
                        >
                          <PlusIcon size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block text-left">
                        Color Copies (₹{shop.pricePerPageColor}/pg)
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const newColor = Math.max(0, selectedFile.printOptions.copiesColor - 1);
                            if (newColor === 0 && selectedFile.printOptions.copiesBW === 0) return;
                            const newBW = selectedFile.printOptions.copiesBW;
                            const total = newBW + newColor;
                            const colorType = newColor > 0 ? (newBW > 0 ? 'mixed' : 'color') : 'bw';
                            
                            updateFileOptions(selectedFile.id, {
                              copiesColor: newColor,
                              copies: total,
                              color: colorType
                            });
                          }}
                          className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                          type="button"
                        >
                          <MinusIcon size={14} />
                        </button>
                        <span className="w-12 text-center text-lg font-semibold text-[var(--text-primary)]">
                          {selectedFile.printOptions.copiesColor}
                        </span>
                        <button
                          onClick={() => {
                            const newColor = selectedFile.printOptions.copiesColor + 1;
                            const newBW = selectedFile.printOptions.copiesBW;
                            const total = newBW + newColor;
                            const colorType = newColor > 0 ? (newBW > 0 ? 'mixed' : 'color') : 'bw';
                            
                            updateFileOptions(selectedFile.id, {
                              copiesColor: newColor,
                              copies: total,
                              color: colorType
                            });
                          }}
                          className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                          type="button"
                        >
                          <PlusIcon size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                    Page Range
                  </label>
                  <input
                    type="text"
                    value={selectedFile.printOptions.pageRange}
                    onChange={(e) =>
                      updateFileOptions(selectedFile.id, { pageRange: e.target.value })
                    }
                    placeholder='e.g. "all" or "1-10, 15-20"'
                    className="w-full h-10 px-3 text-sm rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all"
                  />
                </div>

                {/* Paper Size + Orientation */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                      Paper Size
                    </label>
                    <div className="flex gap-2">
                      {(['A4', 'A3'] as PaperSize[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => updateFileOptions(selectedFile.id, { paperSize: opt })}
                          className={cn(
                            'flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border',
                            selectedFile.printOptions.paperSize === opt
                              ? 'bg-[var(--accent)] text-[var(--text-inverse)] border-[var(--accent)]'
                              : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)]'
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                      Orientation
                    </label>
                    <div className="flex gap-2">
                      {(['portrait', 'landscape'] as Orientation[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => updateFileOptions(selectedFile.id, { orientation: opt })}
                          className={cn(
                            'flex-1 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border',
                            selectedFile.printOptions.orientation === opt
                              ? 'bg-[var(--accent)] text-[var(--text-inverse)] border-[var(--accent)]'
                              : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)]'
                          )}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Extras */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3 block">
                    Extras
                  </label>
                  <div className="space-y-3">
                    {!shop.disabledServices?.includes('bondPaper') && (
                      <Toggle
                        checked={selectedFile.printOptions.bondPaper}
                        onChange={(v) => {
                          const updates: Partial<PrintOptions> = { bondPaper: v };
                          if (v) {
                            updates.side = 'single'; // Enforce single sided
                          }
                          updateFileOptions(selectedFile.id, updates);
                        }}
                        label={`Bond Paper (₹${shop.bondPaperPrice}/page)`}
                      />
                    )}
                    {!shop.disabledServices?.includes('staple') && (
                      <Toggle
                        checked={selectedFile.printOptions.staple}
                        onChange={(v) => updateFileOptions(selectedFile.id, { staple: v })}
                        label={`Staple (₹${shop.staplePrice})`}
                      />
                    )}
                    {!shop.disabledServices?.includes('spiralBinding') && (
                      <Toggle
                        checked={selectedFile.printOptions.spiralBinding}
                        onChange={(v) => updateFileOptions(selectedFile.id, { spiralBinding: v })}
                        label={`Spiral Binding (₹${shop.spiralPrice})`}
                      />
                    )}
                    {!shop.disabledServices?.includes('lamination') && (
                      <Toggle
                        checked={selectedFile.printOptions.lamination}
                        onChange={(v) => updateFileOptions(selectedFile.id, { lamination: v })}
                        label={`Lamination (₹${shop.laminationPrice})`}
                      />
                    )}
                    {shop.customServices && shop.customServices.map((service) => {
                      const isChecked = (selectedFile.printOptions.customServices || []).some(s => s.id === service.id);
                      return (
                        <Toggle
                          key={service.id}
                          checked={isChecked}
                          onChange={(v) => {
                            const current = selectedFile.printOptions.customServices || [];
                            const updated = v
                              ? [...current, { id: service.id, name: service.name, price: service.price }]
                              : current.filter(s => s.id !== service.id);
                            updateFileOptions(selectedFile.id, { customServices: updated });
                          }}
                          label={`${service.name} (₹${service.price})`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column — Order Summary (Sticky) */}
        <div className="lg:sticky lg:top-20 lg:self-start space-y-4 animate-slide-in-right">
          <Card>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Order Summary</h3>

            {files.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-hover)] flex items-center justify-center mx-auto mb-3">
                  <FileIcon size={18} className="text-[var(--text-muted)]" />
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Upload files to see pricing
                </p>
              </div>
            ) : (
              <>
                {/* File breakdown */}
                <div className="space-y-3 mb-4">
                  {files.map((file) => {
                    const printCost = calculateFilePrintingCost(file.pages, file.printOptions, shop);
                    const extrasCost = calculateExtras(file.printOptions, shop);
                    const extras = getExtrasDescription(file.printOptions);

                    return (
                      <div key={file.id} className="pb-3 border-b border-[var(--border-subtle)] last:border-0 last:pb-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {file.pages} pages
                            </p>
                          </div>
                        </div>

                        {/* Printing cost */}
                        <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1.5">
                          <span>
                            Printing (
                            {file.printOptions.bondPaper ? (
                              <span>Bond Paper × {file.printOptions.copiesBW}</span>
                            ) : (
                              <span>
                                {file.printOptions.copiesBW > 0 && `${file.printOptions.copiesBW} B&W`}
                                {file.printOptions.copiesBW > 0 && file.printOptions.copiesColor > 0 && ' + '}
                                {file.printOptions.copiesColor > 0 && `${file.printOptions.copiesColor} Color`}
                              </span>
                            )}
                            )
                          </span>
                          <span>{formatCurrency(printCost)}</span>
                        </div>

                        {/* Extras */}
                        {extras.length > 0 && (
                          <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-0.5">
                            <span>{extras.join(', ')}</span>
                            <span>{formatCurrency(extrasCost)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="border-t border-[var(--border)] pt-3 space-y-1.5">
                  <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                    <span>Printing</span>
                    <span>{formatCurrency(totalPrintingCost)}</span>
                  </div>
                  {totalExtras > 0 && (
                    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                      <span>Binding & Extras</span>
                      <span>{formatCurrency(totalExtras)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold text-[var(--text-primary)] pt-1.5 border-t border-[var(--border-subtle)]">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Note for Shopkeeper */}
                <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider block text-left">
                    Note for Shopkeeper (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., staple files separately, bind securely, keep cover landscape..."
                    className="w-full min-h-[70px] p-2.5 text-xs rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all resize-y"
                  />
                </div>

                {/* Continue Button */}
                {shop.status === 'closed' ? (
                  <Button size="lg" fullWidth disabled className="mt-5">
                    Shop is Closed
                  </Button>
                ) : (
                  <Link href="/checkout" className="block mt-5">
                    <Button size="lg" fullWidth>
                      Continue to Payment
                      <ArrowRightIcon size={16} />
                    </Button>
                  </Link>
                )}
              </>
            )}
          </Card>

          {/* Shop Pricing Info */}
          <Card>
            <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Pricing at {shop.name}
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>B&W per page</span>
                <span className="font-medium text-[var(--text-primary)]">₹{shop.pricePerPageBW}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Color per page</span>
                <span className="font-medium text-[var(--text-primary)]">₹{shop.pricePerPageColor}</span>
              </div>
              {!shop.disabledServices?.includes('bondPaper') && (
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Bond Paper per page</span>
                  <span className="font-medium text-[var(--text-primary)]">₹{shop.bondPaperPrice}</span>
                </div>
              )}
              {!shop.disabledServices?.includes('staple') && (
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Staple</span>
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
                  <span>Lamination</span>
                  <span className="font-medium text-[var(--text-primary)]">₹{shop.laminationPrice}</span>
                </div>
              )}
              {shop.customServices && shop.customServices.map((service) => (
                <div key={service.id} className="flex justify-between text-[var(--text-secondary)]">
                  <span>{service.name}</span>
                  <span className="font-medium text-[var(--text-primary)]">₹{service.price}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <ShopQRModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} shop={shop} hideDownload={true} />
    </div>
  );
}
