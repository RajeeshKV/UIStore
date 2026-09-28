import type { Metadata } from "next";
import { AdminShell } from "@/features/admin/AdminShell";

export const metadata: Metadata = {
  title: {
    default: "Admin | Kromic Store",
    template: "%s | Admin",
  },
  robots: { index: false, follow: false },
};

/**
 * Admin layout — wraps all /admin/* routes except /admin/login.
 * AdminShell provides: AuthProvider, AdminGuard, Sidebar, TopBar.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
