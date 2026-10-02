"use client";

import { useState, Suspense } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";
import { AdminGuard } from "./AdminGuard";

interface AdminShellProps {
  children: React.ReactNode;
}

function AdminShellInner({ children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fb]">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-0">
        <AdminTopBar onMenuClick={() => setSidebarOpen(true)} />
        <main
          id="admin-main"
          className="flex-1 overflow-y-auto p-5 md:p-7"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * AdminShell — wraps protected pages with Guard + Sidebar + TopBar.
 * AdminAuthProvider is provided by the root admin/layout.tsx — not here.
 */
export function AdminShell({ children }: AdminShellProps) {
  return (
    <Suspense fallback={null}>
      <AdminGuard>
        <AdminShellInner>{children}</AdminShellInner>
      </AdminGuard>
    </Suspense>
  );
}
