import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/app/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ordo-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Query paid orders to list platform transactions
    const paidOrders = await prisma.order.findMany({
      where: { paymentStatus: 'paid' },
      orderBy: { updatedAt: 'desc' },
    });

    const transactions = paidOrders.map((order) => {
      const platformFee = order.totalAmount * 0.1; // 10% platform fee
      return {
        id: `txn_${order.id.slice(-8)}`,
        transactionId: `TXN-${order.id.toUpperCase().slice(-8)}`,
        orderId: order.orderId,
        studentName: order.studentName,
        shopName: order.shopName,
        amount: order.totalAmount,
        platformFee,
        shopReceived: order.totalAmount - platformFee,
        method: order.paymentMethod,
        status: 'paid',
        createdAt: order.updatedAt || order.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error: any) {
    console.error('Error fetching admin payments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
  }
}
