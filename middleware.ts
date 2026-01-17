import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip logging for internal API routes and static assets
  if (
    request.nextUrl.pathname.startsWith('/api/internal') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // Allow login page and auth API routes (skip password check)
  if (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // Password protection - check authentication for dashboard and admin routes
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/sessions') ||
    request.nextUrl.pathname.startsWith('/digests') ||
    request.nextUrl.pathname === '/';

  if (isProtectedRoute) {
    const authCookie = request.cookies.get('admin_auth');
    if (!authCookie || authCookie.value !== 'authenticated') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Log the request asynchronously via internal API route
  // This is Edge-safe and doesn't block the response
  const logUrl = new URL('/api/internal/log-visit', request.url);
  logUrl.searchParams.set('url', request.nextUrl.pathname + request.nextUrl.search);
  logUrl.searchParams.set('method', request.method);
  
  // Forward relevant headers
  const headers: Record<string, string> = {};
  const headerKeys = ['user-agent', 'referer', 'x-forwarded-for', 'x-vercel-ip-country', 'x-vercel-ip-city'];
  
  headerKeys.forEach(key => {
    const value = request.headers.get(key);
    if (value) {
      headers[key] = value;
    }
  });

  // Fire and forget - don't await to avoid blocking
  fetch(logUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.INTERNAL_KEY || 'dev-secret',
    },
    body: JSON.stringify({
      headers,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    }),
  }).catch(() => {
    // Silently fail - logging shouldn't break the app
  });

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
