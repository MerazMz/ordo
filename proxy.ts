import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ordo-super-secret-key-change-me-123456789'
);

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('ordo-token')?.value;
  const { pathname } = request.nextUrl;

  // Paths requiring different roles
  const isAdminPath = pathname.startsWith('/admin');
  const isShopkeeperPath = pathname.startsWith('/dashboard');
  
  const isShopsIndex = pathname === '/shops';
  const isPrintPage = pathname.startsWith('/shops/') && pathname.endsWith('/print');
  const isStudentPath =
    isShopsIndex ||
    isPrintPage ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/checkout');
    
  const isAuthPath = pathname.startsWith('/login');

  // Verify JWT
  let payload: any = null;
  if (token) {
    try {
      const { payload: verified } = await jwtVerify(token, JWT_SECRET);
      payload = verified;
    } catch (e) {
      // Invalid token
    }
  }

  // 1. If trying to access Auth Path (Login page) and already logged in
  if (isAuthPath && payload) {
    if (payload.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else if (payload.role === 'shopkeeper') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/shops', request.url));
    }
  }

  // 2. If trying to access Admin Dashboard but not an admin
  if (isAdminPath) {
    if (!payload || payload.role !== 'admin') {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 3. If trying to access Shopkeeper Dashboard but not a shopkeeper
  if (isShopkeeperPath) {
    if (!payload || payload.role !== 'shopkeeper') {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 4. If trying to access Student paths but not authenticated
  if (isStudentPath) {
    if (!payload) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/shops/:path*',
    '/orders/:path*',
    '/checkout/:path*',
    '/login',
  ],
};
