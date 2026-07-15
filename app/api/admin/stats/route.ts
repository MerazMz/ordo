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

    // 1. Fetch total counts
    const totalShops = await prisma.shop.count();
    const totalStudents = await prisma.user.count({ where: { role: 'student' } });
    
    // 2. Fetch order metrics
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const platformRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    // 10% commission on platform revenue
    const commissionEarned = platformRevenue * 0.1;

    // 3. Fetch shops sorted by revenue
    const shops = await prisma.shop.findMany({
      orderBy: { totalRevenue: 'desc' },
      take: 5,
    });

    // 4. Fetch support tickets (dummy empty array for now since support isn't in db schema)
    const supportTicketsCount = 0;

    return NextResponse.json({
      success: true,
      data: {
        totalShops,
        totalStudents,
        todayOrders: todayOrders.length,
        todayRevenue,
        platformRevenue,
        commissionEarned,
        recentOrders: orders.slice(0, 10),
        topShops: shops.map((s) => ({
          shopId: s.id,
          shopName: s.name,
          totalOrders: s.totalOrders,
          totalRevenue: s.totalRevenue,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin statistics:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
