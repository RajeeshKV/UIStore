"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";
import { AdminAuthProvider } from "./AdminAuthContext";
import { AdminGuard } from "./AdminGuard";

interface AdminShellProps {
  children: React.ReactNode;
}

function AdminShellInner({ children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-0">
        <AdminTopBar onMenuClick={() => setSidebarOpen(true)} />
        <main
          id="admin-main"
          className="flex-1 overflow-y-auto p-4 md:p-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <AdminAuthProvider>
      <AdminGuard>
        <AdminShellInner>{children}</AdminShellInner>
      </AdminGuard>
    </AdminAuthProvider>
  );
}
