// Orders Route Cache Buster: Schema update for fileData in OrderItem
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/app/lib/auth';
import { generateOrderId } from '@/app/lib/utils';

// Get orders based on user role
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ordo-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let orders;

    if (payload.role === 'admin') {
      // Admin sees all platform orders
      orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } else if (payload.role === 'shopkeeper') {
      // Shopkeeper sees only their shop's orders, sorted in FCFS order for waiting/printing
      if (!payload.shopId) {
        return NextResponse.json({ success: true, data: [], count: 0 });
      }
      
      orders = await prisma.order.findMany({
        where: { shopId: payload.shopId },
        orderBy: [
          { status: 'asc' }, // places waiting/printing/ready before collected/cancelled
          { queueNumber: 'asc' }, // FCFS order
        ],
      });
    } else {
      // Student sees their own orders
      orders = await prisma.order.findMany({
        where: { studentId: payload.userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Resolve shop addresses
    const shopIds = Array.from(new Set(orders.map((o) => o.shopId)));
    const shops = await prisma.shop.findMany({
      where: { id: { in: shopIds } },
      select: { id: true, address: true },
    });
    const shopAddressMap = Object.fromEntries(shops.map((s) => [s.id, s.address]));

    const ordersWithAddress = orders.map((order) => ({
      ...order,
      shopAddress: shopAddressMap[order.shopId] || 'Campus Hub',
    }));

    return NextResponse.json({
      success: true,
      data: ordersWithAddress,
      count: ordersWithAddress.length,
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// Student creates a new order
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ordo-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Only students can create orders' }, { status: 403 });
    }

    const body = await request.json();
    const {
      shopId,
      items,
      totalPages,
      totalAmount,
      bindingTotal,
      printingTotal,
      paymentMethod,
      notes,
    } = body;

    if (!shopId || !items || items.length === 0 || !totalAmount) {
      return NextResponse.json(
        { success: false, error: 'Invalid order parameters.' },
        { status: 400 }
      );
    }

    // Fetch the shop details
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    }

    if (shop.status === 'closed') {
      return NextResponse.json(
        { success: false, error: 'This shop is currently closed. Cannot place order.' },
        { status: 400 }
      );
    }

    // Fetch student user details (phone)
    const student = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student profile not found' }, { status: 404 });
    }

    // Calculate queue number: find count of orders for this shop today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrdersCount = await prisma.order.count({
      where: {
        shopId: shop.id,
        createdAt: {
          gte: today,
        },
      },
    });

    // Estimate waiting time and queue number based on active queue length
    const activeOrdersCount = await prisma.order.count({
      where: {
        shopId: shop.id,
        status: { in: ['waiting', 'printing'] },
      },
    });
    const queueNumber = activeOrdersCount + 1;
    const estimatedWaitMinutes = Math.max(5, activeOrdersCount * 4); // ~4 minutes per print order

    // Generate clean display order ID
    const orderDisplayId = generateOrderId();

    // Create the order
    const order = await prisma.order.create({
      data: {
        orderId: orderDisplayId,
        studentId: student.id,
        studentName: student.name,
        studentPhone: student.phone,
        shopId: shop.id,
        shopName: shop.name,
        items: items.map((item: any) => ({
          fileId: item.id || item.fileId,
          fileName: item.name || item.fileName,
          pages: item.pages,
          price: item.price,
          fileData: item.fileData || null,
          printOptions: {
            color: item.printOptions.color,
            side: item.printOptions.side,
            copies: item.printOptions.copies,
            pageRange: item.printOptions.pageRange,
            paperSize: item.printOptions.paperSize,
            orientation: item.printOptions.orientation,
            staple: item.printOptions.staple,
            spiralBinding: item.printOptions.spiralBinding,
            lamination: item.printOptions.lamination,
          },
        })),
        totalPages,
        totalAmount,
        bindingTotal: bindingTotal || 0,
        printingTotal: printingTotal || totalAmount,
        status: 'waiting', // Starts as waiting
        queueNumber,
        estimatedWaitMinutes,
        paymentStatus: 'pending',
        paymentMethod: paymentMethod || 'counter',
        notes: notes || null,
      },
    });

    // Increment shop queue counter metrics
    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        queueLength: { increment: 1 },
        estimatedWaitMinutes: { increment: 4 },
        totalOrders: { increment: 1 },
        totalRevenue: { increment: totalAmount },
        commission: { increment: totalAmount * 0.1 }, // 10% commission
      },
    });

    // Increment student total orders metrics
    await prisma.user.update({
      where: { id: student.id },
      data: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: totalAmount },
      },
    });

    // Broadcast to Socket.io
    // @ts-ignore
    const io = global.io;
    if (io) {
      io.to(`shop:${shop.id}`).emit('queue-update', {
        message: `New order placed by ${student.name}.`
      });
      io.to(`student:${student.id}`).emit('student-order-update', {
        orderId: order.id,
        status: order.status,
        shopName: shop.name,
        message: `Your print order at ${shop.name} has been placed successfully.`
      });
      // Notify admin room
      io.to('admin').emit('admin-new-order', {
        orderId: order.orderId,
        studentName: student.name,
        shopName: shop.name,
      });
    }

    return NextResponse.json({
      success: true,
      data: order,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error placing order:', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}
