import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  // E2E tests mock Supabase auth in the browser and can't satisfy this
  // server-side check with a real session; only set outside production.
  if (process.env.PLAYWRIGHT_AUTH_BYPASS === '1') {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: ['/admin/:path*', '/auth/login'],
};
