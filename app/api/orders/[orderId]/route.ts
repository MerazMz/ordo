import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/app/lib/auth';

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await ctx.params;

    const cookieStore = await cookies();
    const token = cookieStore.get('ordo-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    const order = await prisma.order.findFirst({
      where: isObjectId
        ? {
            OR: [
              { id: orderId },
              { orderId: orderId }
            ]
          }
        : { orderId: orderId }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Access control
    if (payload.role === 'student' && order.studentId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (payload.role === 'shopkeeper' && order.shopId !== payload.shopId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Calculate live queue position
    let liveQueuePosition = order.queueNumber;
    let liveEstimatedWaitMinutes = order.estimatedWaitMinutes;

    if (order.status === 'waiting' || order.status === 'printing') {
      const activeBeforeCount = await prisma.order.count({
        where: {
          shopId: order.shopId,
          status: { in: ['waiting', 'printing'] },
          createdAt: { lt: order.createdAt },
        },
      });
      liveQueuePosition = activeBeforeCount + 1;
      liveEstimatedWaitMinutes = Math.max(5, activeBeforeCount * 4);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        queueNumber: liveQueuePosition,
        estimatedWaitMinutes: liveEstimatedWaitMinutes,
      },
    });
  } catch (error: any) {
    console.error('Error fetching order details:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await ctx.params;
    const body = await request.json();
    const { status, message } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get('ordo-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || (payload.role !== 'shopkeeper' && payload.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Staff access required.' }, { status: 403 });
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    const order = await prisma.order.findFirst({
      where: isObjectId
        ? {
            OR: [
              { id: orderId },
              { orderId: orderId }
            ]
          }
        : { orderId: orderId }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // If shopkeeper, ensure they own the order's shop
    if (payload.role === 'shopkeeper' && order.shopId !== payload.shopId) {
      return NextResponse.json({ success: false, error: 'Forbidden. Not your shop.' }, { status: 403 });
    }

    const oldStatus = order.status;

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status,
        cancellationMessage: status === 'cancelled' ? (message || 'Order cancelled by shopkeeper') : order.cancellationMessage,
        completedAt: (status === 'collected' || status === 'cancelled') ? new Date() : order.completedAt,
        paymentStatus: status === 'collected' ? 'paid' : order.paymentStatus,
        paidAt: (status === 'collected' && !order.paidAt) ? new Date() : order.paidAt,
        updatedAt: new Date(),
      },
    });

    // Update Shop queue statistics depending on transition
    if ((status === 'collected' || status === 'cancelled') && (oldStatus === 'waiting' || oldStatus === 'printing')) {
      const activeOrdersCount = await prisma.order.count({
        where: {
          shopId: order.shopId,
          status: { in: ['waiting', 'printing'] },
        },
      });

      await prisma.shop.update({
        where: { id: order.shopId },
        data: {
          queueLength: { decrement: 1 },
          estimatedWaitMinutes: activeOrdersCount * 4,
        },
      });
    }

    // Broadcast to Socket.io
    // @ts-ignore
    const io = global.io;
    if (io) {
      let statusText = status;
      if (status === 'accepted') statusText = 'accepted & queued';
      else if (status === 'ready') statusText = 'ready for pickup';
      
      const msg = `Your order from ${order.shopName} is now ${statusText}.`;

      io.to(`order:${order.id}`).emit('status-update', { status });
      io.to(`order:${order.orderId}`).emit('status-update', { status });
      io.to(`shop:${order.shopId}`).emit('queue-update', {
        message: `Order #${order.orderId.slice(-6)} status updated to ${statusText}.`
      });
      io.to(`student:${order.studentId}`).emit('student-order-update', {
        orderId: order.id,
        status: status,
        shopName: order.shopName,
        message: msg
      });
      // Notify admin of cancellation
      if (status === 'cancelled') {
        io.to('admin').emit('admin-order-cancelled', {
          orderId: order.orderId,
          shopName: order.shopName,
          reason: message || null,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
