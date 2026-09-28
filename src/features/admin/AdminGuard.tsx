"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "./AdminAuthContext";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Guards all /admin/(protected)/* routes.
 * - Not authenticated → redirect to /admin/login?redirect=<path>
 * - Loading → show spinner
 * - Authenticated → render children
 *
 * AdminAuthProvider is at admin/layout.tsx (root), so context is always available.
 * This guard is ONLY used inside (protected)/layout.tsx — never on auth pages.
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
    if (!mounted || isLoading) return;
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(pathname);
      router.replace(`/admin/login?redirect=${redirect}`);
    }
  }, [mounted, isLoading, isAuthenticated, pathname, router]);

  // Before hydration: render nothing (avoids SSR mismatch)
  if (!mounted) return null;

  // Auth resolving
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Kromic Store" className="h-14 w-14 object-contain" />
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2 w-24" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect in flight
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
