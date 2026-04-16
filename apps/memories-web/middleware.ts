import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('sessionBodas');

  if (request.nextUrl.pathname.startsWith('/app') && !session) {
    // Allow client-side auth fallback (localStorage) — don't hard-redirect,
    // just set a header that the client can check
    const response = NextResponse.next();
    response.headers.set('x-memories-auth', 'none');
    return response;
  }

  return NextResponse.next();
}

export const config = { matcher: ['/app/:path*'] };
