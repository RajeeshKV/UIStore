"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "./AdminAuthContext";
import { Skeleton } from "@/components/ui/Skeleton";

// Public admin paths that should never be redirected away from
const ADMIN_PUBLIC_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

/**
 * Client-side guard for protected admin routes.
 *
 * Strategy:
 * 1. On first render (SSR + hydration), render nothing — auth state unknown.
 * 2. After mount, check if this is a public path — if so, always render.
 * 3. While auth is loading, show a loading screen.
 * 4. If not authenticated on a protected path, redirect to /admin/login.
 * 5. If authenticated, render children.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isLoading) return;

    // Never redirect away from public paths
    const isPublic = ADMIN_PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "?"),
    );
    if (isPublic) return;

    if (!isAuthenticated) {
      const redirect = encodeURIComponent(pathname);
      router.replace(`/admin/login?redirect=${redirect}`);
    }
  }, [mounted, isLoading, isAuthenticated, pathname, router]);

  // Before hydration: render nothing to avoid SSR mismatch
  if (!mounted) return null;

  // Check if current path is a public admin path — always render it
  const isPublicPath = ADMIN_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "?"),
  );
  if (isPublicPath) return <>{children}</>;

  // Protected path — show loading state while auth resolves
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

  // Not authenticated on protected path — redirect in progress
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
