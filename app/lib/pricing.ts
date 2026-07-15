// ============================================
// ORDO — Pricing Engine
// ============================================

import type { PrintOptions, UploadedFile, Shop } from './types';

// Default pricing (used when no shop-specific pricing is available)
const DEFAULT_PRICES = {
  bwPerPage: 3,
  colorPerPage: 10,
  doubleSideDiscount: 0.8, // 20% off for double-sided
  a3Multiplier: 2,
  staple: 5,
  spiralBinding: 30,
  lamination: 20,
  bondPaper: 5,
};

/**
 * Calculate the number of printed pages given total pages and page range.
 */
export function calculatePageCount(
  totalPages: number,
  pageRange: string
): number {
  if (!pageRange || pageRange === 'all' || pageRange === '') {
    return totalPages;
  }

  const ranges = pageRange.split(',').map((r) => r.trim());
  let count = 0;

  for (const range of ranges) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        count += Math.min(end, totalPages) - Math.max(start, 1) + 1;
      }
    } else {
      const page = Number(range);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        count += 1;
      }
    }
  }

  return Math.max(count, 0);
}

/**
 * Calculate printing cost for a single file.
 */
export function calculateFilePrintingCost(
  pages: number,
  options: PrintOptions,
  shopPricing?: Partial<Shop>
): number {
  const priceBW = options.bondPaper
    ? shopPricing?.bondPaperPrice ?? DEFAULT_PRICES.bondPaper
    : shopPricing?.pricePerPageBW ?? DEFAULT_PRICES.bwPerPage;

  const priceColor = options.bondPaper
    ? shopPricing?.bondPaperPrice ?? DEFAULT_PRICES.bondPaper
    : shopPricing?.pricePerPageColor ?? DEFAULT_PRICES.colorPerPage;

  // Calculate actual pages to print
  const pagesToPrint = calculatePageCount(pages, options.pageRange);

  // Apply double-side discount (fewer sheets needed) - bond paper is single sided only
  let effectivePages = pagesToPrint;
  if (options.side === 'double' && !options.bondPaper) {
    effectivePages = Math.ceil(pagesToPrint / 2);
  }

  // A3 costs more
  let multiplier = 1;
  if (options.paperSize === 'A3') {
    multiplier = DEFAULT_PRICES.a3Multiplier;
  }

  // Split calculations for B&W copies and Color copies
  const costBW = effectivePages * priceBW * multiplier * (options.copiesBW || 0);
  const costColor = effectivePages * priceColor * multiplier * (options.copiesColor || 0);

  return Math.round(costBW + costColor);
}

/**
 * Calculate binding/extras cost for a single file.
 */
export function calculateExtras(
  options: PrintOptions,
  shopPricing?: Partial<Shop>
): number {
  let extras = 0;

  const disabled = shopPricing?.disabledServices || [];

  if (options.staple && !disabled.includes('staple')) {
    extras += shopPricing?.staplePrice ?? DEFAULT_PRICES.staple;
  }

  if (options.spiralBinding && !disabled.includes('spiralBinding')) {
    extras += shopPricing?.spiralPrice ?? DEFAULT_PRICES.spiralBinding;
  }

  if (options.lamination && !disabled.includes('lamination')) {
    extras += shopPricing?.laminationPrice ?? DEFAULT_PRICES.lamination;
  }

  // Sum custom selected services
  if (options.customServices && options.customServices.length > 0) {
    for (const service of options.customServices) {
      extras += service.price;
    }
  }

  // Extras are per copy (total of B&W and Color copies)
  const totalCopies = (options.copiesBW || 0) + (options.copiesColor || 0);
  return extras * totalCopies;
}

/**
 * Calculate total price for a single uploaded file.
 */
export function calculateFilePrice(
  file: { pages: number; printOptions: PrintOptions },
  shopPricing?: Partial<Shop>
): number {
  const printingCost = calculateFilePrintingCost(
    file.pages,
    file.printOptions,
    shopPricing
  );
  const extrasCost = calculateExtras(file.printOptions, shopPricing);
  return printingCost + extrasCost;
}

/**
 * Calculate total order price for multiple files.
 */
export function calculateOrderTotal(
  files: UploadedFile[],
  shopPricing?: Partial<Shop>
): {
  printingTotal: number;
  bindingTotal: number;
  grandTotal: number;
  breakdown: {
    fileName: string;
    pages: number;
    printingCost: number;
    extrasCost: number;
    total: number;
  }[];
} {
  let printingTotal = 0;
  let bindingTotal = 0;

  const breakdown = files.map((file) => {
    const printingCost = calculateFilePrintingCost(
      file.pages,
      file.printOptions,
      shopPricing
    );
    const extrasCost = calculateExtras(file.printOptions, shopPricing);

    printingTotal += printingCost;
    bindingTotal += extrasCost;

    return {
      fileName: file.name,
      pages: file.pages,
      printingCost,
      extrasCost,
      total: printingCost + extrasCost,
    };
  });

  return {
    printingTotal,
    bindingTotal,
    grandTotal: printingTotal + bindingTotal,
    breakdown,
  };
}

/**
 * Get a formatted price description for print options.
 */
export function getPrintDescription(options: PrintOptions): string {
  const parts: string[] = [];
  
  if (options.bondPaper) {
    parts.push('Bond Paper');
  } else {
    const copyTypes = [];
    if (options.copiesBW > 0) copyTypes.push(`${options.copiesBW} B&W`);
    if (options.copiesColor > 0) copyTypes.push(`${options.copiesColor} Color`);
    parts.push(copyTypes.join(' + ') || 'B&W');
  }

  parts.push(options.bondPaper ? 'Single Side' : options.side === 'double' ? 'Double Side' : 'Single Side');
  parts.push(options.paperSize);
  
  const totalCopies = (options.copiesBW || 0) + (options.copiesColor || 0);
  if (totalCopies > 1) {
    parts.push(`${totalCopies} copies total`);
  }
  return parts.join(' · ');
}

/**
 * Get extras description.
 */
export function getExtrasDescription(options: PrintOptions): string[] {
  const extras: string[] = [];
  if (options.bondPaper) extras.push('Bond Paper');
  if (options.staple) extras.push('Staple');
  if (options.spiralBinding) extras.push('Spiral Binding');
  if (options.lamination) extras.push('Lamination');
  
  if (options.customServices && options.customServices.length > 0) {
    for (const service of options.customServices) {
      extras.push(service.name);
    }
  }
  return extras;
}
