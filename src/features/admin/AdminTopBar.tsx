"use client";

import { SidebarToggle } from "./AdminSidebar";
import { useAdminAuth } from "./AdminAuthContext";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AdminTopBarProps {
  onMenuClick: () => void;
}

const BREADCRUMBS: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/products": "Products",
  "/admin/products/new": "New Product",
  "/admin/categories": "Categories",
  "/admin/brands": "Brands",
  "/admin/orders": "Orders",
  "/admin/promotions": "Promotions",
  "/admin/promotions/new": "New Promotion",
  "/admin/tax": "Tax",
  "/admin/shipping": "Shipping",
  "/admin/settings/basic": "Basic Info",
  "/admin/settings/policies": "Policies",
  "/admin/settings/seo": "SEO",
  "/admin/settings/integrations/payment": "Payment",
  "/admin/settings/integrations/google": "Google OAuth",
  "/admin/settings/integrations/email": "Email",
};

export function AdminTopBar({ onMenuClick }: AdminTopBarProps) {
  const { admin, logout } = useAdminAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const pageTitle = BREADCRUMBS[pathname] ?? "Admin";
  const adminName =
    admin?.firstName
      ? `${admin.firstName}${admin.lastName ? ` ${admin.lastName}` : ""}`
      : admin?.email ?? "Admin";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 backdrop-blur-sm px-4">
      <SidebarToggle onClick={onMenuClick} />

      <h1 className="text-h4 font-semibold text-foreground flex-1">{pageTitle}</h1>

      {/* Admin profile menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label="Admin account menu"
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5",
            "text-body-sm text-foreground-muted hover:bg-muted hover:text-foreground",
            "transition-colors duration-150",
          )}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-caption font-semibold">
            <User className="size-3.5" />
          </div>
          <span className="hidden sm:block max-w-32 truncate">{adminName}</span>
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-border bg-background shadow-md py-1">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-body-sm font-medium text-foreground truncate">{adminName}</p>
                {admin?.email && (
                  <p className="text-caption text-foreground-muted truncate">{admin.email}</p>
                )}
              </div>
              <button
                onClick={() => { setMenuOpen(false); void logout(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
