import type { Metadata } from "next";
import { AdminAuthProvider } from "@/features/admin/AdminAuthContext";

export const metadata: Metadata = {
  title: {
    default: "Admin | Kromic Store",
    template: "%s | Admin",
  },
  robots: { index: false, follow: false },
};

/**
 * Root admin layout — provides AdminAuthContext to ALL /admin/* routes.
 * No shell or guard here — those are added by (protected)/layout.tsx only.
 * Auth pages (/admin/login etc.) need the context to check if already logged in.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
