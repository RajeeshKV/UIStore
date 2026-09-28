import { NextResponse } from "next/server";

/**
 * Next.js 16 proxy (replaces middleware.ts).
 *
 * Admin auth is enforced entirely client-side by AdminGuard, which reads
 * the JWT from localStorage. The Edge proxy cannot access localStorage, so
 * no token check is done here — all requests pass through.
 */
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
