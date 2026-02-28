import { NextResponse } from 'next/server';

export function middleware(request) {
  const ref = request.nextUrl.searchParams.get('ref');

  if (ref) {
    const response = NextResponse.next();
    response.cookies.set('affiliate_ref', ref, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      httpOnly: false, // client JS needs to read this
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
