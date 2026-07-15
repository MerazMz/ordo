import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/app/lib/auth';

// Get list of shops
export async function GET() {
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: shops,
      count: shops.length,
    });
  } catch (error: any) {
    console.error('Error fetching shops:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch shops' }, { status: 500 });
  }
}

// Admin creates a shop + shopkeeper account
export async function POST(request: Request) {
  try {
    // 1. Check if requester is Admin
    const cookieStore = await cookies();
    const token = cookieStore.get('ordo-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      shopName,
      address,
      shopPhone,
      ownerName,
      ownerEmail,
      ownerPassword,
      ownerPhone,
      pricePerPageBW,
      pricePerPageColor,
      bindingPrice,
      spiralPrice,
      laminationPrice,
      staplePrice,
      bondPaperPrice,
    } = body;

    // Validate fields
    if (
      !shopName ||
      !address ||
      !shopPhone ||
      !ownerName ||
      !ownerEmail ||
      !ownerPassword ||
      !ownerPhone
    ) {
      return NextResponse.json(
        { success: false, error: 'All fields (shop info & owner info) are required.' },
        { status: 400 }
      );
    }

    // Check if owner email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email is already registered by another user.' },
        { status: 400 }
      );
    }

    // 3. Create the shopkeeper user
    const hashedOwnerPassword = await bcrypt.hash(ownerPassword, 10);
    const shopkeeper = await prisma.user.create({
      data: {
        name: ownerName,
        email: ownerEmail,
        password: hashedOwnerPassword,
        phone: ownerPhone,
        role: 'shopkeeper',
      },
    });

    // 4. Create the shop linked to the shopkeeper
    const shop = await prisma.shop.create({
      data: {
        name: shopName,
        address,
        phone: shopPhone,
        ownerId: shopkeeper.id,
        ownerName: shopkeeper.name,
        rating: 4.5,
        totalRatings: 0,
        status: 'open', // defaults to open
        isVerified: true, // admin created shops are auto-verified
        pricePerPageBW: pricePerPageBW ? parseFloat(pricePerPageBW) : 3,
        pricePerPageColor: pricePerPageColor ? parseFloat(pricePerPageColor) : 10,
        bindingPrice: bindingPrice ? parseFloat(bindingPrice) : 25,
        spiralPrice: spiralPrice ? parseFloat(spiralPrice) : 30,
        laminationPrice: laminationPrice ? parseFloat(laminationPrice) : 20,
        staplePrice: staplePrice ? parseFloat(staplePrice) : 5,
        bondPaperPrice: bondPaperPrice ? parseFloat(bondPaperPrice) : 5,
        operatingHoursOpen: '08:00',
        operatingHoursClose: '20:00',
        disabledServices: [],
        customServices: [],
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        shop,
        shopkeeper: {
          id: shopkeeper.id,
          name: shopkeeper.name,
          email: shopkeeper.email,
        },
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating shop:', error);
    return NextResponse.json({ success: false, error: 'Failed to create shop' }, { status: 500 });
  }
}
