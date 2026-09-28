"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAdminAuth } from "./AdminAuthContext";
import { Skeleton } from "@/components/ui/Skeleton";

// Paths that bypass auth check (public admin pages)
const ADMIN_PUBLIC_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

/**
 * Unified admin auth guard.
 *
 * Rules:
 * - Public paths (/admin/login etc): always render.
 *   BUT if user is already authenticated → redirect to /admin (dashboard).
 * - Protected paths: if not authenticated → redirect to /admin/login?redirect=<path>.
 *   If authenticated → render children.
 * - While auth resolves (isLoading) → show loading screen (protected) or nothing (public).
 * - Uses mounted flag to avoid SSR hydration mismatch.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPublicPath = ADMIN_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "?"),
  );

  useEffect(() => {
    if (!mounted || isLoading) return;

    if (isPublicPath) {
      // Already logged in — send to intended destination or dashboard
      if (isAuthenticated) {
        const redirect = searchParams.get("redirect");
        const dest =
          redirect && redirect.startsWith("/admin") ? redirect : "/admin";
        router.replace(dest);
      }
      // Not logged in — stay on public path, no redirect needed
      return;
    }

    // Protected path — redirect to login if not authenticated
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(pathname);
      router.replace(`/admin/login?redirect=${redirect}`);
    }
  }, [mounted, isLoading, isAuthenticated, isPublicPath, pathname, searchParams, router]);

  // SSR / before hydration: render nothing
  if (!mounted) return null;

  if (isPublicPath) {
    // Loading: show nothing while we check if already logged in
    if (isLoading) return null;
    // Already authenticated: redirect in progress, show nothing
    if (isAuthenticated) return null;
    // Not authenticated: show the public page (login form etc.)
    return <>{children}</>;
  }

  // Protected path below this point
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Kromic Store"
            className="h-14 w-14 object-contain"
          />
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2 w-24" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect in progress
  if (!isAuthenticated) return null;

  // Authenticated — render the protected page
  return <>{children}</>;
}
