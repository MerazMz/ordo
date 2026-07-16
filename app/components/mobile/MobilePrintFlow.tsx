'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn, formatFileSize } from '@/app/lib/utils';
import { calculateFilePrintingCost, calculateExtras } from '@/app/lib/pricing';
import type { PrintOptions, PrintSide, PaperSize, Shop } from '@/app/lib/types';

// ─── Page Range Validation ────────────────────────────────────────────────────

/**
 * Validates a page range string the same way a printer driver does.
 * Accepts: "all", "1", "1-5", "1,3,5-8", etc.
 * Returns null if valid, or an error message string if invalid.
 */
function validatePageRange(range: string, totalPages: number): string | null {
  if (!range || range.trim().toLowerCase() === 'all') return null;

  const clean = range.trim();
  // Each comma-separated token must be either a single number or a "n-m" range
  const tokens = clean.split(',').map((t) => t.trim());

  for (const token of tokens) {
    if (!token) return 'Empty segment — remove the extra comma.';

    if (token.includes('-')) {
      const parts = token.split('-');
      if (parts.length !== 2) return `"${token}" is not a valid range.`;
      const a = Number(parts[0]);
      const b = Number(parts[1]);
      if (!Number.isInteger(a) || !Number.isInteger(b) || isNaN(a) || isNaN(b))
        return `"${token}" contains non-numeric values.`;
      if (a < 1 || b < 1) return `Page numbers must be ≥ 1.`;
      if (a > b) return `"${token}" — start must be ≤ end.`;
      if (b > totalPages) return `Page ${b} exceeds document length (${totalPages} pages).`;
    } else {
      const n = Number(token);
      if (!Number.isInteger(n) || isNaN(n)) return `"${token}" is not a valid page number.`;
      if (n < 1) return `Page numbers must be ≥ 1.`;
      if (n > totalPages) return `Page ${n} exceeds document length (${totalPages} pages).`;
    }
  }
  return null;
}

// ─── Icon Helpers ─────────────────────────────────────────────────────────────

function BackIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CloudUploadIcon({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function FileDocIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function ChevronDown({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface LocalFile {
  id: string;
  name: string;
  size: number;
  type: string;
  pages: number;
  fileData?: string;
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

// ─── Step Progress Bar ────────────────────────────────────────────────────────

type Step = 'upload' | 'options' | 'preview' | 'confirm';
const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  {
    id: 'upload',
    label: 'Upload',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    id: 'options',
    label: 'Options',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </svg>
    ),
  },
  {
    id: 'preview',
    label: 'Preview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="12" y2="17" />
      </svg>
    ),
  },
  {
    id: 'confirm',
    label: 'Confirm',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

function StepBar({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-start justify-between px-2 py-4">
      {STEPS.map((step, idx) => {
        const isActive = idx === currentIdx;
        const isDone = idx < currentIdx;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5 w-14">
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center transition-all', isActive ? 'bg-[var(--text-primary)] text-[var(--background)]' : isDone ? 'bg-[var(--text-primary)]/20 text-[var(--text-primary)]' : 'bg-[var(--surface-hover)] text-[var(--text-muted)]')}>
                {step.icon}
              </div>
              <span className={cn('text-[10px] font-semibold transition-colors', isActive ? 'text-[var(--text-primary)]' : isDone ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]')}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mt-5 mx-1 rounded-full transition-colors', idx < currentIdx ? 'bg-[var(--text-primary)]/50' : 'bg-[var(--border-subtle)]')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Header Bar ──────────────────────────────────────────────────────────────

function MobileHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border-subtle)]/45 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="relative flex items-center justify-between px-4 h-12">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center text-[var(--text-primary)] hover:opacity-75 transition-opacity cursor-pointer focus:outline-none" aria-label="Back">
          <BackIcon size={20} />
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <p className="text-[13px] font-bold text-[var(--text-primary)] uppercase tracking-wider leading-tight">{title}</p>
        </div>
        <div className="w-9" />
      </div>
    </div>
  );
}

// ─── Step 1: Upload ───────────────────────────────────────────────────────────

function UploadStep({ files, onAddFiles, onRemoveFile }: { files: LocalFile[]; onAddFiles: (fl: FileList) => void; onRemoveFile: (id: string) => void }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const totalPages = files.reduce((sum, f) => sum + f.pages, 0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) onAddFiles(e.dataTransfer.files);
  };

  return (
    <div className="px-5 pb-32 space-y-4 text-left">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn('rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[200px]', dragActive ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--surface)]')}
      >
        <CloudUploadIcon size={52} />
        <p className="text-[15px] font-bold text-[var(--text-primary)] mt-3">Drop files here</p>
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">or click to upload</p>
        <p className="text-[11px] text-[var(--text-muted)] mt-2">PDF, JPG, PNG supported</p>
        <p className="text-[11px] text-[var(--text-muted)]">Max 50 MB per file</p>
        <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => e.target.files && onAddFiles(e.target.files)} />
      </div>

      {files.length > 0 && (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
          <div className="p-4 pb-2">
            <p className="text-sm font-bold text-[var(--text-primary)]">Files to Print</p>
          </div>
          {files.map((file) => (
            <div key={file.id} className="px-4 py-3 flex items-start gap-3 border-t border-[var(--border-subtle)]/60">
              <div className="w-9 h-9 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileDocIcon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{file.name}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {file.pages} {file.pages === 1 ? 'Page' : 'Pages'} &bull; {formatFileSize(file.size)}
                </p>
              </div>
              <button onClick={() => onRemoveFile(file.id)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors focus:outline-none mt-0.5" aria-label="Remove file">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
          <div className="px-4 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <p className="text-sm font-bold text-[var(--text-primary)]">Total Pages</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">{totalPages}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Per-File Options Card ────────────────────────────────────────────────────

function FileOptionsCard({
  file,
  shop,
  isExpanded,
  onToggle,
  onUpdateOptions,
  rangeError,
  onRangeChange,
}: {
  file: LocalFile;
  shop: Shop;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateOptions: (opts: Partial<PrintOptions>) => void;
  rangeError: string | null;
  onRangeChange: (raw: string) => void;
}) {
  const opts = file.printOptions;

  const Checkbox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer', checked ? 'border-[var(--text-primary)] bg-[var(--text-primary)]' : 'border-[var(--border-subtle)]')} onClick={onChange}>
      {checked && <CheckIcon />}
    </div>
  );

  const CounterRow = ({ label, value, onDec, onInc }: { label: string; value: number; onDec: () => void; onInc: () => void }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)]">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
      <div className="flex items-center gap-4">
        <button onClick={onDec} className="w-8 h-8 rounded-full border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer focus:outline-none">
          <MinusIcon />
        </button>
        <span className="text-sm font-bold text-[var(--text-primary)] w-6 text-center">{value}</span>
        <button onClick={onInc} className="w-8 h-8 rounded-full border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer focus:outline-none">
          <PlusIcon />
        </button>
      </div>
    </div>
  );

  const activeCopies = opts.color === 'color' ? opts.copiesColor : opts.copiesBW;
  const setActiveCopies = (n: number) => {
    if (opts.color === 'color') {
      onUpdateOptions({ copiesColor: n, copies: n });
    } else {
      onUpdateOptions({ copiesBW: n, copies: n });
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] overflow-hidden">
      {/* Accordion Header */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 cursor-pointer focus:outline-none">
        <div className="w-9 h-9 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center flex-shrink-0">
          <FileDocIcon size={18} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{file.name}</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {file.pages} pages &bull; {opts.color === 'bw' ? 'B&W' : 'Color'} &bull; {opts.side === 'single' ? 'Single' : 'Double'} &bull; ×{activeCopies}
          </p>
        </div>
        <ChevronDown size={18} className={cn('text-[var(--text-muted)] transition-transform duration-200 flex-shrink-0', isExpanded ? 'rotate-180' : '')} />
      </button>

      {/* Accordion Body */}
      {isExpanded && (
        <div className="border-t border-[var(--border-subtle)] px-4 py-4 space-y-5">
          {/* Print Type */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text-muted)] mb-3">Print Type</p>
            <div className="flex gap-3">
              {(['bw', 'color'] as const).map((type) => {
                const isActive = opts.color === type;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      const newBW = opts.copiesBW > 0 ? opts.copiesBW : 1;
                      const newColor = opts.copiesColor > 0 ? opts.copiesColor : 1;
                      onUpdateOptions({ color: type, copiesBW: type === 'bw' ? newBW : opts.copiesBW, copiesColor: type === 'color' ? newColor : opts.copiesColor, copies: type === 'bw' ? newBW : newColor });
                    }}
                    className={cn('flex-1 flex items-center gap-2 py-3 px-4 rounded-2xl border-2 text-sm font-semibold transition-all cursor-pointer', isActive ? 'border-[#D4A76A] bg-[#FDF6EC] text-[var(--text-primary)]' : 'border-[var(--border-subtle)] bg-[var(--background)] text-[var(--text-muted)]')}
                  >
                    {isActive && (
                      <div className="w-4 h-4 rounded-full border-2 border-[#D4A76A] flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-[#D4A76A]" />
                      </div>
                    )}
                    {type === 'bw' ? 'B&W' : 'Color'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Print Sides */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text-muted)] mb-3">Print Sides</p>
            <div className="flex gap-3">
              {([{ val: 'single', label: 'Single Sided' }, { val: 'double', label: 'Double Sided' }] as { val: PrintSide; label: string }[]).map(({ val, label }) => {
                const isActive = opts.side === val;
                return (
                  <button key={val} onClick={() => onUpdateOptions({ side: val })} className={cn('flex-1 flex items-center gap-2 py-3 px-3 rounded-2xl border-2 text-[12px] font-semibold transition-all cursor-pointer', isActive ? 'border-[#D4A76A] bg-[#FDF6EC] text-[var(--text-primary)]' : 'border-[var(--border-subtle)] bg-[var(--background)] text-[var(--text-muted)]')}>
                    {isActive && <span className="text-[#D4A76A] text-base leading-none">✦</span>}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paper Size */}
          <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)]">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Paper Size</p>
            <div className="flex items-center gap-1">
              <select value={opts.paperSize} onChange={(e) => onUpdateOptions({ paperSize: e.target.value as PaperSize })} className="text-sm font-semibold text-[var(--text-primary)] bg-transparent border-none focus:outline-none cursor-pointer appearance-none">
                <option value="A4">A4</option>
                <option value="A3">A3</option>
              </select>
              <ChevronDown size={12} className="text-[var(--text-muted)]" />
            </div>
          </div>

          {/* Pages — read-only */}
          <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)]">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Total Pages</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">{file.pages}</p>
          </div>

          {/* Copies */}
          <CounterRow
            label="Copies"
            value={activeCopies}
            onDec={() => setActiveCopies(Math.max(1, activeCopies - 1))}
            onInc={() => setActiveCopies(activeCopies + 1)}
          />

          {/* Page Range */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text-muted)] mb-2">Page Range</p>
            <div className="flex gap-2 mb-2">
              {(['all', 'custom'] as const).map((mode) => {
                const isActive = mode === 'all' ? (opts.pageRange === 'all' || !opts.pageRange) : (opts.pageRange !== 'all' && !!opts.pageRange);
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      if (mode === 'all') {
                        onUpdateOptions({ pageRange: 'all' });
                        onRangeChange('all');
                      } else {
                        onUpdateOptions({ pageRange: '' });
                        onRangeChange('');
                      }
                    }}
                    className={cn('px-4 py-2 rounded-xl text-xs font-semibold border-2 transition-all cursor-pointer', isActive ? 'border-[#D4A76A] bg-[#FDF6EC] text-[var(--text-primary)]' : 'border-[var(--border-subtle)] bg-[var(--background)] text-[var(--text-muted)]')}
                  >
                    {mode === 'all' ? 'All Pages' : 'Custom Range'}
                  </button>
                );
              })}
            </div>

            {opts.pageRange !== 'all' && (
              <div>
                <input
                  type="text"
                  value={opts.pageRange}
                  onChange={(e) => {
                    onUpdateOptions({ pageRange: e.target.value });
                    onRangeChange(e.target.value);
                  }}
                  placeholder='e.g. 1-5, 8, 10-12'
                  className={cn(
                    'w-full h-10 px-3 text-sm rounded-xl bg-[var(--background)] border text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-all',
                    rangeError ? 'border-red-400 focus:border-red-500' : 'border-[var(--border-subtle)] focus:border-[var(--border-strong)]'
                  )}
                />
                {rangeError && (
                  <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {rangeError}
                  </p>
                )}
                {!rangeError && opts.pageRange && opts.pageRange !== 'all' && (
                  <p className="text-[11px] text-emerald-600 mt-1.5 flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Valid range
                  </p>
                )}
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Separate page numbers or ranges with commas.</p>
              </div>
            )}
          </div>

          {/* Add-ons */}
          {((!shop.disabledServices?.includes('spiralBinding')) || (!shop.disabledServices?.includes('lamination')) || (!shop.disabledServices?.includes('staple')) || (shop.customServices && shop.customServices.length > 0)) && (
            <div>
              <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text-muted)] mb-2">Add-Ons</p>
              <div className="space-y-0">
                {!shop.disabledServices?.includes('spiralBinding') && (
                  <label className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0', opts.spiralBinding ? 'border-[var(--text-primary)] bg-[var(--text-primary)]' : 'border-[var(--border-subtle)]')} onClick={() => onUpdateOptions({ spiralBinding: !opts.spiralBinding })}>
                        {opts.spiralBinding && <CheckIcon />}
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">Spiral Binding</span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">₹{shop.spiralPrice}</span>
                  </label>
                )}
                {!shop.disabledServices?.includes('lamination') && (
                  <label className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0', opts.lamination ? 'border-[var(--text-primary)] bg-[var(--text-primary)]' : 'border-[var(--border-subtle)]')} onClick={() => onUpdateOptions({ lamination: !opts.lamination })}>
                        {opts.lamination && <CheckIcon />}
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">Lamination</span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">₹{shop.laminationPrice}</span>
                  </label>
                )}
                {!shop.disabledServices?.includes('staple') && (
                  <label className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0', opts.staple ? 'border-[var(--text-primary)] bg-[var(--text-primary)]' : 'border-[var(--border-subtle)]')} onClick={() => onUpdateOptions({ staple: !opts.staple })}>
                        {opts.staple && <CheckIcon />}
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">Staple</span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">₹{shop.staplePrice}</span>
                  </label>
                )}
                {shop.customServices?.map((service) => {
                  const isChecked = (opts.customServices || []).some((s) => s.id === service.id);
                  return (
                    <label key={service.id} className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0', isChecked ? 'border-[var(--text-primary)] bg-[var(--text-primary)]' : 'border-[var(--border-subtle)]')} onClick={() => {
                          const current = opts.customServices || [];
                          const updated = isChecked ? current.filter((s) => s.id !== service.id) : [...current, { id: service.id, name: service.name, price: service.price }];
                          onUpdateOptions({ customServices: updated });
                        }}>
                          {isChecked && <CheckIcon />}
                        </div>
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{service.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">₹{service.price}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Print Options ────────────────────────────────────────────────────

function PrintOptionsStep({
  files,
  shop,
  onUpdateOptions,
  notes,
  onNotesChange,
  expandedId,
  onSetExpanded,
  rangeErrors,
  onRangeChange,
}: {
  files: LocalFile[];
  shop: Shop;
  onUpdateOptions: (fileId: string, opts: Partial<PrintOptions>) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  expandedId: string | null;
  onSetExpanded: (id: string | null) => void;
  rangeErrors: Record<string, string | null>;
  onRangeChange: (fileId: string, raw: string) => void;
}) {
  return (
    <div className="px-5 pb-36 space-y-4 text-left">
      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--text-muted)]">Per-Document Settings</p>
      {files.map((file) => (
        <FileOptionsCard
          key={file.id}
          file={file}
          shop={shop}
          isExpanded={expandedId === file.id}
          onToggle={() => onSetExpanded(expandedId === file.id ? null : file.id)}
          onUpdateOptions={(opts) => onUpdateOptions(file.id, opts)}
          rangeError={rangeErrors[file.id] ?? null}
          onRangeChange={(raw) => onRangeChange(file.id, raw)}
        />
      ))}

      {/* Custom Notes */}
      <div>
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--text-muted)] mb-3">Note for Shopkeeper</p>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="e.g. staple files separately, keep cover landscape, bind securely..."
          rows={3}
          className="w-full px-4 py-3 text-sm rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-all resize-none"
        />
      </div>
    </div>
  );
}

// ─── Step 3: Preview ──────────────────────────────────────────────────────────

function OrderPreviewStep({ files, shop }: { files: LocalFile[]; shop: Shop }) {
  if (!files.length) return null;

  const grandTotal = files.reduce((sum, f) => {
    return sum + calculateFilePrintingCost(f.pages, f.printOptions, shop) + calculateExtras(f.printOptions, shop);
  }, 0);

  return (
    <div className="px-5 pb-36 space-y-5 text-left">
      {/* Document Stack Illustration */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-center py-6 gap-3">
        {files.slice(0, 3).map((f, i) => (
          <div
            key={f.id}
            className="flex flex-col items-center justify-start px-3 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] shadow-sm"
            style={{ width: `${Math.min(42, 90 / files.length)}%`, transform: `rotate(${(i - Math.floor(files.length / 2)) * 3}deg)` }}
          >
            {Array.from({ length: 6 }).map((_, row) => (
              <div key={row} className={`h-1.5 rounded-sm bg-[var(--border-subtle)] mb-1 ${row === 0 ? 'w-full' : row % 3 === 0 ? 'w-2/3' : 'w-5/6'}`} />
            ))}
          </div>
        ))}
      </div>

      {/* Per-file summary cards */}
      {files.map((file, idx) => {
        const opts = file.printOptions;
        const printCost = calculateFilePrintingCost(file.pages, opts, shop);
        const extrasCost = calculateExtras(opts, shop);
        const fileTotal = printCost + extrasCost;
        const activeCopies = opts.color === 'color' ? opts.copiesColor : opts.copiesBW;

        const rows = [
          { label: 'Print Type', value: opts.color === 'bw' ? 'B&W' : 'Color' },
          { label: 'Paper Size', value: opts.paperSize },
          { label: 'Print Sides', value: opts.side === 'single' ? 'Single Sided' : 'Double Sided' },
          { label: 'Copies', value: String(activeCopies) },
          { label: 'Page Range', value: opts.pageRange || 'All' },
          opts.spiralBinding ? { label: 'Spiral Binding', value: 'Yes' } : null,
          opts.lamination ? { label: 'Lamination', value: 'Yes' } : null,
          opts.staple ? { label: 'Staple', value: 'Yes' } : null,
          ...(opts.customServices?.map((s) => ({ label: s.name, value: 'Yes' })) || []),
        ].filter(Boolean) as { label: string; value: string }[];

        return (
          <div key={file.id} className="rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
            {/* File header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[var(--surface)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center flex-shrink-0">
                <FileDocIcon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{file.name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{file.pages} pages</p>
              </div>
              <p className="text-[13px] font-bold text-[var(--text-primary)]">₹{fileTotal.toFixed(0)}</p>
            </div>

            {/* Spec rows */}
            <div className="divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                  <p className="text-[12px] text-[var(--text-secondary)]">{row.label}</p>
                  <p className="text-[12px] font-semibold text-[var(--text-primary)]">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Grand Total */}
      <div className="flex items-center justify-between py-4 border-t border-[var(--border-subtle)]">
        <p className="text-[15px] font-bold text-[var(--text-primary)]">Total Amount</p>
        <p className="text-[15px] font-bold text-[var(--text-primary)]">₹{grandTotal.toFixed(0)}</p>
      </div>
    </div>
  );
}

// ─── Bottom CTA Bar ───────────────────────────────────────────────────────────

function BottomCTA({ label, onClick, disabled = false, loading = false }: { label: string; onClick: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-5 pb-4 pt-3 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-transparent">
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={cn('w-full py-4 rounded-2xl text-sm font-bold tracking-wide transition-all', disabled || loading ? 'bg-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed' : 'bg-[var(--text-primary)] text-[var(--background)] hover:opacity-90 cursor-pointer')}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            Placing Order…
          </span>
        ) : label}
      </button>
    </div>
  );
}

// ─── Main Mobile Print Flow Component ────────────────────────────────────────

interface MobilePrintFlowProps {
  shop: Shop;
  shopId: string;
  onPlaceOrder: (files: LocalFile[], notes: string) => Promise<void>;
}

export default function MobilePrintFlow({ shop, shopId, onPlaceOrder }: MobilePrintFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  // Per-file accordion expanded state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Per-file page range validation errors
  const [rangeErrors, setRangeErrors] = useState<Record<string, string | null>>({});

  const addFiles = useCallback(async (fileList: FileList) => {
    const fileArray = Array.from(fileList);
    const convertToBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

    for (const file of fileArray) {
      let pages = 1;
      if (file.type === 'application/pdf') {
        const { getPdfPageCount } = await import('@/app/lib/utils');
        pages = await getPdfPageCount(file);
      }
      let fileData: string | undefined;
      try { fileData = await convertToBase64(file); } catch { console.error('Failed to convert file to base64'); }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setFiles((prev) => [...prev, { id, name: file.name, size: file.size, type: file.type, pages, fileData, printOptions: { ...defaultPrintOptions } }]);
      // Auto-expand the first file added
      setExpandedId((prev) => prev ?? id);
    }
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setRangeErrors((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  const updateOptions = (fileId: string, opts: Partial<PrintOptions>) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, printOptions: { ...f.printOptions, ...opts } } : f)));
  };

  const handleRangeChange = (fileId: string, raw: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    const err = validatePageRange(raw, file.pages);
    setRangeErrors((prev) => ({ ...prev, [fileId]: err }));
  };

  // True if any file has a non-null range error
  const hasRangeErrors = Object.values(rangeErrors).some((e) => e !== null);

  const handleBack = () => {
    if (step === 'upload') router.push(`/shops/${shopId}`);
    else if (step === 'options') setStep('upload');
    else if (step === 'preview') setStep('options');
  };

  const handleNext = async () => {
    if (step === 'upload') { setStep('options'); setExpandedId(files[0]?.id ?? null); }
    else if (step === 'options') setStep('preview');
    else if (step === 'preview') {
      setProcessing(true);
      try { await onPlaceOrder(files, notes); } finally { setProcessing(false); }
    }
  };

  const stepTitle: Record<Step, string> = { upload: shop.name, options: 'Print Options', preview: 'Order Preview', confirm: 'Order Confirmed' };
  const ctaLabel: Record<Step, string> = { upload: 'Continue', options: 'Preview Order', preview: 'Confirm & Pay', confirm: 'View My Orders' };
  const canContinue = step === 'upload' ? files.length > 0 : !hasRangeErrors;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <MobileHeader title={stepTitle[step]} onBack={handleBack} />

      {step !== 'confirm' && (
        <div className="px-5 border-b border-[var(--border-subtle)]">
          <StepBar current={step} />
        </div>
      )}

      <div className="pt-4">
        {step === 'upload' && <UploadStep files={files} onAddFiles={addFiles} onRemoveFile={removeFile} />}
        {step === 'options' && (
          <PrintOptionsStep
            files={files}
            shop={shop}
            onUpdateOptions={updateOptions}
            notes={notes}
            onNotesChange={setNotes}
            expandedId={expandedId}
            onSetExpanded={setExpandedId}
            rangeErrors={rangeErrors}
            onRangeChange={handleRangeChange}
          />
        )}
        {step === 'preview' && <OrderPreviewStep files={files} shop={shop} />}
      </div>

      {step !== 'confirm' && (
        <BottomCTA
          label={shop.status === 'closed' && step === 'preview' ? 'Shop is Closed' : ctaLabel[step]}
          onClick={handleNext}
          disabled={!canContinue || (shop.status === 'closed' && step === 'preview')}
          loading={processing}
        />
      )}
    </div>
  );
}
