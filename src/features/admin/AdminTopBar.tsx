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
  "/admin/settings/integrations/sms": "SMS",
  "/admin/carousel": "Carousel",
};

export function AdminTopBar({ onMenuClick }: AdminTopBarProps) {
  const { admin, logout } = useAdminAuth();
  const pathname  = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const pageTitle = BREADCRUMBS[pathname] ?? "Admin";
  const adminName =
    admin?.firstName
      ? `${admin.firstName}${admin.lastName ? ` ${admin.lastName}` : ""}`
      : admin?.email ?? "Admin";

  const initials = (adminName[0] ?? "A").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#e1e2e4] bg-white/95 backdrop-blur-sm px-4">
      <SidebarToggle onClick={onMenuClick} />

      <h1 className="text-[16px] font-bold text-[#191c1e] flex-1 tracking-tight">{pageTitle}</h1>

      {/* Admin profile menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label="Admin account menu"
          className={cn(
            "flex items-center gap-2 rounded-xl px-2 py-1.5",
            "text-[13px] text-[#444748] hover:bg-[#f3f4f6] hover:text-[#191c1e]",
            "transition-colors duration-150",
          )}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0D0D0D] text-white text-[11px] font-bold">
            {initials}
          </div>
          <span className="hidden sm:block max-w-32 truncate font-medium">{adminName}</span>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 top-full mt-2 z-20 w-52 rounded-2xl border border-[#e1e2e4] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] py-1.5">
              <div className="px-4 py-3 border-b border-[#e1e2e4]">
                <p className="text-[13px] font-bold text-[#191c1e] truncate">{adminName}</p>
                {admin?.email && (
                  <p className="text-[11px] text-[#5A6578] truncate">{admin.email}</p>
                )}
              </div>
              <button
                onClick={() => { setMenuOpen(false); void logout(); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#444748] hover:bg-danger/5 hover:text-danger transition-colors"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
