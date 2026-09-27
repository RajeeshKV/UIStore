import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection middleware.
 *
 * Admin auth is enforced client-side by AdminGuard (reads localStorage JWT).
 * The Edge middleware cannot read localStorage, so we don't attempt token
 * validation here — that would require a cookie-based session which this app
 * doesn't use.
 *
 * This middleware only handles the /admin prefix to allow Next.js routing
 * to work correctly. All actual auth enforcement is in AdminGuard.tsx.
 */
export function middleware(request: NextRequest) {
  // Allow all requests through — AdminGuard handles client-side protection.
  return NextResponse.next();
}

export const config = {
  // Only run on admin routes to keep the matcher tight.
  matcher: ["/admin/:path*"],
};
