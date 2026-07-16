import { PDFDocument } from 'pdf-lib';

// ============================================
// ORDO — Utility Functions
// ============================================

/**
 * Merge CSS class names, filtering out falsy values.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format number as Indian Rupees.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with commas (Indian numbering).
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format file size in human-readable form.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format date as relative time (e.g., "5 min ago").
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Format date as short date (e.g., "12 Jul 2024").
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format time (e.g., "2:30 PM").
 */
export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format minutes as duration (e.g., "12 minutes").
 */
export function formatWaitTime(minutes: number): string {
  if (minutes <= 1) return '1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

/**
 * Generate a random ID.
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Generate a display order ID.
 */
export function generateOrderId(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${new Date().getFullYear()}-${num}`;
}

/**
 * Generate a queue number.
 */
export function generateQueueNumber(): number {
  return Math.floor(Math.random() * 40) + 10;
}

/**
 * Get initials from a name.
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate string with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Get status color variables.
 */
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (status) {
    case 'open':
    case 'paid':
    case 'collected':
    case 'resolved':
    case 'active':
      return {
        bg: 'bg-[var(--success-bg)]',
        text: 'text-[var(--success)]',
        dot: 'bg-[var(--success)]',
      };
    case 'waiting':
    case 'pending':
    case 'in-progress':
      return {
        bg: 'bg-[var(--warning-bg)]',
        text: 'text-[var(--warning)]',
        dot: 'bg-[var(--warning)]',
      };
    case 'printing':
    case 'busy':
      return {
        bg: 'bg-[var(--info-bg)]',
        text: 'text-[var(--info)]',
        dot: 'bg-[var(--info)]',
      };
    case 'closed':
    case 'failed':
    case 'cancelled':
    case 'suspended':
      return {
        bg: 'bg-[var(--error-bg)]',
        text: 'text-[var(--error)]',
        dot: 'bg-[var(--error)]',
      };
    case 'ready':
      return {
        bg: 'bg-[var(--success-bg)]',
        text: 'text-[var(--success)]',
        dot: 'bg-[var(--success)]',
      };
    default:
      return {
        bg: 'bg-[var(--surface-hover)]',
        text: 'text-[var(--text-secondary)]',
        dot: 'bg-[var(--text-muted)]',
      };
  }
}

/**
 * Delay for animations.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get the real page count of an uploaded PDF file.
 */
export async function getPdfPageCount(file: File): Promise<number> {
  if (file.type !== 'application/pdf') {
    return 1;
  }
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc.getPageCount();
  } catch (error) {
    console.error("Error reading PDF page count:", error);
    return 1; // Fallback
  }
}
