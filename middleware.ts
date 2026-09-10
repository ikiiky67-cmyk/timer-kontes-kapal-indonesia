import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (authToken !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect /operator routes
  if (request.nextUrl.pathname.startsWith('/operator')) {
    if (!authToken?.startsWith('operator_')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/operator/:path*'],
};
