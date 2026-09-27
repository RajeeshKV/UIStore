/**
 * Admin public auth layout — no AdminShell, no guard.
 * Applies to /admin/login, /admin/forgot-password, /admin/reset-password.
 */
export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
