import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'crm-automation-super-secure-key-32chars-min';
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass next internals, auth APIs, and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('crm_admin_token')?.value;

  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, getSecretKey());
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  const isAuthPage = pathname === '/login';
  const isProtectedPage =
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/plans') ||
    pathname.startsWith('/conversations') ||
    pathname.startsWith('/leads') ||
    pathname.startsWith('/usage') ||
    pathname.startsWith('/channels') ||
    pathname.startsWith('/integrations') ||
    pathname.startsWith('/settings');

  // If not authenticated and trying to access admin dashboard -> redirect to /login
  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('crm_admin_token');
    return response;
  }

  // If already authenticated and trying to access login page -> redirect to /dashboard
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/clients/:path*',
    '/plans/:path*',
    '/conversations/:path*',
    '/leads/:path*',
    '/usage/:path*',
    '/channels/:path*',
    '/integrations/:path*',
    '/settings/:path*',
  ],
};
