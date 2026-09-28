"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./AuthContext";

/**
 * Used on /auth/login.
 * If the user is already authenticated, redirect them to the intended
 * destination (or home). Renders nothing — purely a redirect guard.
 */
export function AuthRedirectGuard() {
  const { isAuthenticated, isLoading } = useAuth();
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
      // Only use redirect if it's a storefront path (not admin)
      const dest =
        redirect &&
        redirect.startsWith("/") &&
        !redirect.startsWith("/admin")
          ? redirect
          : "/";
      router.replace(dest);
    }
  }, [mounted, isLoading, isAuthenticated, router, searchParams]);

  return null;
}
