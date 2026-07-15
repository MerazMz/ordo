import { NextResponse } from 'next/server';
import { calculateFilePrintingCost, calculateExtras } from '@/app/lib/pricing';
import type { PrintOptions } from '@/app/lib/types';

export async function POST(request: Request) {
  const body = await request.json();

  const { files, shopPricing } = body as {
    files: { pages: number; printOptions: PrintOptions }[];
    shopPricing?: {
      pricePerPageBW?: number;
      pricePerPageColor?: number;
      staplePrice?: number;
      spiralPrice?: number;
      laminationPrice?: number;
    };
  };

  let printingTotal = 0;
  let bindingTotal = 0;

  const breakdown = files.map((file: { pages: number; printOptions: PrintOptions }) => {
    const printingCost = calculateFilePrintingCost(
      file.pages,
      file.printOptions,
      shopPricing
    );
    const extrasCost = calculateExtras(file.printOptions, shopPricing);

    printingTotal += printingCost;
    bindingTotal += extrasCost;

    return {
      pages: file.pages,
      printingCost,
      extrasCost,
      total: printingCost + extrasCost,
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      printingTotal,
      bindingTotal,
      grandTotal: printingTotal + bindingTotal,
      breakdown,
    },
  });
}
