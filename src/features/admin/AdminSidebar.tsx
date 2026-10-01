"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Percent,
  Settings,
  Plug,
  ChevronDown,
  ChevronRight,
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Nav structure ─────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

const NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="size-4" />,
  },
  {
    label: "Catalog",
    icon: <Package className="size-4" />,
    children: [
      { label: "Products", href: "/admin/products" },
      { label: "Categories", href: "/admin/categories" },
      { label: "Brands", href: "/admin/brands" },
    ],
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: <ShoppingCart className="size-4" />,
  },
  {
    label: "Commerce",
    icon: <Percent className="size-4" />,
    children: [
      { label: "Promotions", href: "/admin/promotions" },
      { label: "Tax", href: "/admin/tax" },
      { label: "Shipping", href: "/admin/shipping" },
    ],
  },
  {
    label: "Store",
    icon: <Settings className="size-4" />,
    children: [
      { label: "Basic Info", href: "/admin/settings/basic" },
      { label: "Policies", href: "/admin/settings/policies" },
      { label: "SEO", href: "/admin/settings/seo" },
    ],
  },
  {
    label: "Integrations",
    icon: <Plug className="size-4" />,
    children: [
      { label: "Payment", href: "/admin/settings/integrations/payment" },
      { label: "Google OAuth", href: "/admin/settings/integrations/google" },
      { label: "Email", href: "/admin/settings/integrations/email" },
      { label: "SMS", href: "/admin/settings/integrations/sms" },
    ],
  },
];

// ── Sidebar component ─────────────────────────────────────────────────────────

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
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 flex-col",
          "bg-background border-r border-border",
          "transition-transform duration-300 ease-out-smooth",
          "flex flex-col",
          // Mobile: slide in/out; desktop: always visible
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto",
        )}
        aria-label="Admin navigation"
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0">
          <Link
            href="/admin"
            className="flex items-center gap-2 font-bold text-foreground"
            onClick={onClose}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Kromic Store" className="h-9 w-9 object-contain shrink-0" />
            <span className="text-label font-bold tracking-tight uppercase">
              Admin
            </span>
          </Link>
          <button
            aria-label="Close navigation"
            onClick={onClose}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
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

// ── Mobile toggle button (exported for TopBar use) ────────────────────────────

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Open navigation menu"
      onClick={onClick}
      className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted transition-colors"
    >
      <Menu className="size-5" />
    </button>
  );
}

// ── Nav entry (handles groups + leaf links) ───────────────────────────────────

function NavEntry({
  item,
  onClose,
}: {
  item: NavItem;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (item.children) {
      return item.children.some((c) => pathname.startsWith(c.href));
    }
    return false;
  });

  if (item.href) {
    const active =
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname.startsWith(item.href);
    return (
      <li>
        <Link
          href={item.href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-body-sm font-medium",
            "transition-colors duration-150",
            active
              ? "bg-primary text-primary-foreground"
              : "text-foreground-muted hover:bg-muted hover:text-foreground",
          )}
          aria-current={active ? "page" : undefined}
        >
          {item.icon}
          {item.label}
        </Link>
      </li>
    );
  }

  // Group with children
  const anyActive = item.children?.some((c) => pathname.startsWith(c.href));

  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "w-full flex items-center gap-3 rounded-md px-3 py-2 text-body-sm font-medium",
          "transition-colors duration-150",
          anyActive
            ? "text-foreground"
            : "text-foreground-muted hover:bg-muted hover:text-foreground",
        )}
      >
        {item.icon}
        <span className="flex-1 text-left">{item.label}</span>
        {open ? (
          <ChevronDown className="size-3.5 transition-transform" />
        ) : (
          <ChevronRight className="size-3.5 transition-transform" />
        )}
      </button>

      {open && (
        <ul className="ml-7 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-3">
          {item.children?.map((child) => {
            const active = pathname.startsWith(child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center rounded-md px-2 py-1.5 text-body-sm",
                    "transition-colors duration-150",
                    active
                      ? "font-medium text-foreground"
                      : "text-foreground-muted hover:text-foreground",
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
