import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/app/lib/auth';

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await ctx.params;
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: shop,
    });
  } catch (error: any) {
    console.error('Error fetching shop details:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch shop' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await ctx.params;
    const body = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get('ordo-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    }

    // Access control: only admin or the shopkeeper owner can modify it
    if (payload.role !== 'admin' && (payload.role !== 'shopkeeper' || shop.ownerId !== payload.userId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const {
      name,
      address,
      phone,
      status,
      pricePerPageBW,
      pricePerPageColor,
      bindingPrice,
      spiralPrice,
      laminationPrice,
      staplePrice,
      bondPaperPrice,
      operatingHoursOpen,
      operatingHoursClose,
      disabledServices,
      customServices,
      imageUrl,
    } = body;

    const updated = await prisma.shop.update({
      where: { id: shopId },
      data: {
        name: name !== undefined ? name : shop.name,
        address: address !== undefined ? address : shop.address,
        phone: phone !== undefined ? phone : shop.phone,
        status: status !== undefined ? status : shop.status,
        pricePerPageBW: pricePerPageBW !== undefined ? parseFloat(pricePerPageBW) : shop.pricePerPageBW,
        pricePerPageColor: pricePerPageColor !== undefined ? parseFloat(pricePerPageColor) : shop.pricePerPageColor,
        bindingPrice: bindingPrice !== undefined ? parseFloat(bindingPrice) : shop.bindingPrice,
        spiralPrice: spiralPrice !== undefined ? parseFloat(spiralPrice) : shop.spiralPrice,
        laminationPrice: laminationPrice !== undefined ? parseFloat(laminationPrice) : shop.laminationPrice,
        staplePrice: staplePrice !== undefined ? parseFloat(staplePrice) : shop.staplePrice,
        bondPaperPrice: bondPaperPrice !== undefined ? parseFloat(bondPaperPrice) : shop.bondPaperPrice,
        operatingHoursOpen: operatingHoursOpen !== undefined ? operatingHoursOpen : shop.operatingHoursOpen,
        operatingHoursClose: operatingHoursClose !== undefined ? operatingHoursClose : shop.operatingHoursClose,
        disabledServices: disabledServices !== undefined ? disabledServices : shop.disabledServices,
        customServices: customServices !== undefined ? customServices : shop.customServices,
        imageUrl: imageUrl !== undefined ? imageUrl : shop.imageUrl,
      },
    });

    // Broadcast status update to Socket.io clients
    // @ts-ignore
    const io = global.io;
    if (io) {
      io.emit('shop-status-update', { shopId: updated.id, status: updated.status });
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating shop settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update shop' }, { status: 500 });
  }
}
