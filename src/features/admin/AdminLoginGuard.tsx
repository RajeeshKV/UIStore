"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminAuth } from "./AdminAuthContext";

/**
 * Used only on /admin/login (and forgot/reset password pages).
 * If the admin is already authenticated, redirect to the intended page
 * or the dashboard — so a logged-in admin never sees the login form.
 */
export function AdminLoginGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;
    if (isAuthenticated) {
      const redirect = searchParams.get("redirect");
      const dest =
        redirect && redirect.startsWith("/admin") && !redirect.startsWith("/admin/login")
          ? redirect
          : "/admin";
      router.replace(dest);
    }
  }, [mounted, isLoading, isAuthenticated, router, searchParams]);

  // Before hydration: render nothing
  if (!mounted) return null;

  // Loading: render nothing (brief flash while checking auth)
  if (isLoading) return null;

  // Already authenticated: redirect in flight
  if (isAuthenticated) return null;

  // Not authenticated: show the login/forgot/reset page
  return <>{children}</>;
}
