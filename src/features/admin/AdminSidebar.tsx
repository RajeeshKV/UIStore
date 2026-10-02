"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, Percent,
  Settings, Plug, ChevronDown, ChevronRight, X, Menu, Images,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="size-4" /> },
  {
    label: "Catalog",
    icon: <Package className="size-4" />,
    children: [
      { label: "Products",   href: "/admin/products"   },
      { label: "Categories", href: "/admin/categories" },
      { label: "Brands",     href: "/admin/brands"     },
    ],
  },
  { label: "Orders",   href: "/admin/orders",   icon: <ShoppingCart className="size-4" /> },
  { label: "Carousel", href: "/admin/carousel", icon: <Images className="size-4" /> },
  {
    label: "Commerce",
    icon: <Percent className="size-4" />,
    children: [
      { label: "Promotions", href: "/admin/promotions"  },
      { label: "Tax",        href: "/admin/tax"         },
      { label: "Shipping",   href: "/admin/shipping"    },
    ],
  },
  {
    label: "Store",
    icon: <Settings className="size-4" />,
    children: [
      { label: "Basic Info", href: "/admin/settings/basic"    },
      { label: "Policies",   href: "/admin/settings/policies" },
      { label: "SEO",        href: "/admin/settings/seo"      },
    ],
  },
  {
    label: "Integrations",
    icon: <Plug className="size-4" />,
    children: [
      { label: "Payment",     href: "/admin/settings/integrations/payment" },
      { label: "Google OAuth",href: "/admin/settings/integrations/google"  },
      { label: "Email",       href: "/admin/settings/integrations/email"   },
      { label: "SMS",         href: "/admin/settings/integrations/sms"     },
    ],
  },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-60 flex flex-col",
          // Design: white surface, clean border
          "bg-white border-r border-[#e1e2e4]",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto",
        )}
        aria-label="Admin navigation"
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-[#e1e2e4] px-4 shrink-0">
          <Link href="/admin" className="flex items-center gap-2 group" onClick={onClose}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Shopey" className="h-8 w-8 object-contain shrink-0" />
            <span className="text-[13px] font-bold tracking-widest uppercase text-[#191c1e]">Admin</span>
          </Link>
          <button
            aria-label="Close navigation"
            onClick={onClose}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-[#444748] hover:bg-[#f3f4f6] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          <ul className="flex flex-col gap-0.5">
            {NAV.map((item) => (
              <NavEntry key={item.label} item={item} onClose={onClose} />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Open navigation menu"
      onClick={onClick}
      className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-[#191c1e] hover:bg-[#f3f4f6] transition-colors"
    >
      <Menu className="size-5" />
    </button>
  );
}

function NavEntry({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (item.children) return item.children.some((c) => pathname.startsWith(c.href));
    return false;
  });

  if (item.href) {
    const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
    return (
      <li>
        <Link
          href={item.href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium",
            "transition-all duration-150",
            active
              ? "bg-[#0D0D0D] text-white"
              : "text-[#444748] hover:bg-[#f3f4f6] hover:text-[#191c1e]",
          )}
          aria-current={active ? "page" : undefined}
        >
          {item.icon}
          {item.label}
        </Link>
      </li>
    );
  }

  const anyActive = item.children?.some((c) => pathname.startsWith(c.href));

  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium",
          "transition-all duration-150",
          anyActive ? "text-[#191c1e]" : "text-[#444748] hover:bg-[#f3f4f6] hover:text-[#191c1e]",
        )}
      >
        {item.icon}
        <span className="flex-1 text-left">{item.label}</span>
        {open
          ? <ChevronDown className="size-3.5" />
          : <ChevronRight className="size-3.5" />}
      </button>

      {open && (
        <ul className="ml-7 mt-0.5 flex flex-col gap-0.5 border-l border-[#e1e2e4] pl-3">
          {item.children?.map((child) => {
            const active = pathname.startsWith(child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center rounded-lg px-2 py-2 text-[13px] transition-colors duration-150",
                    active
                      ? "font-bold text-[#191c1e]"
                      : "text-[#5A6578] hover:text-[#191c1e]",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
