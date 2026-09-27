import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection middleware.
 *
 * Admin routes (/admin/**) except /admin/login require a valid token.
 * Token presence is checked server-side; role validation happens in the
 * AdminAuthProvider client-side (the server has no access to the JWT secret).
 *
 * Customer routes do not require a token at the middleware level —
 * individual pages handle auth as needed.
 */

const ADMIN_PUBLIC = ["/admin/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin route protection ─────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    // Allow public admin routes through
    if (ADMIN_PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "?"))) {
      return NextResponse.next();
    }

    // Check for an access token in cookies (set during SSR) or
    // fall through to client-side AdminGuard which reads localStorage.
    // Next.js middleware runs on the Edge and cannot read localStorage,
    // so we rely on a short-lived cookie set by the client when it has a token.
    const token = request.cookies.get("kromic_admin_token")?.value;

    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
