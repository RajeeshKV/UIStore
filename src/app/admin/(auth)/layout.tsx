"use client";

import { Suspense } from "react";
import { AdminLoginGuard } from "@/features/admin/AdminLoginGuard";

/**
 * Layout for /admin/login, /admin/forgot-password, /admin/reset-password.
 * No sidebar/shell. If already logged in, AdminLoginGuard redirects to dashboard.
 */
export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AdminLoginGuard>{children}</AdminLoginGuard>
    </Suspense>
  );
}
