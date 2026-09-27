"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "./AdminAuthContext";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Client-side guard that wraps all protected admin pages.
 * Renders nothing until mounted (avoids SSR/client hydration mismatch).
 * While auth is resolving shows a full-page skeleton.
 * If user is not an admin, redirects to /admin/login.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  // Server render and first client paint: render nothing to avoid mismatch
  if (!mounted) return null;

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

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
