import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/app/lib/auth';

export async function POST(
  request: Request,
  ctx: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await ctx.params;
    const { rating } = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get('ordo-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const numericRating = parseFloat(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ success: false, error: 'Invalid rating value' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    }

    const newTotalRatings = shop.totalRatings + 1;
    const newRating = ((shop.rating * shop.totalRatings) + numericRating) / newTotalRatings;

    const updated = await prisma.shop.update({
      where: { id: shopId },
      data: {
        rating: Math.round(newRating * 10) / 10,
        totalRatings: newTotalRatings,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error submitting rating:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit rating' }, { status: 500 });
  }
}
