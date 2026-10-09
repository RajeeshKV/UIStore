"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, User, MapPin, ShoppingBag, Heart, Star, MessageCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthContext";
import { Skeleton } from "@/components/ui/Skeleton";

interface AccountLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: "Overview",  href: "/account",            icon: LayoutDashboard },
  { label: "Profile",   href: "/account/profile",   icon: User },
  { label: "Orders",    href: "/account/orders",    icon: ShoppingBag },
  { label: "Wishlist",  href: "/account/wishlist",  icon: Heart },
  { label: "Reviews",   href: "/account/reviews",   icon: Star },
  { label: "Support",   href: "/account/support",   icon: MessageCircle },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
] as const;

export function AccountLayout({ children }: AccountLayoutProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) return <AccountLayoutSkeleton />;
  if (!isAuthenticated) return null;

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email ?? "My Account";

  const initials = (displayName[0] ?? "A").toUpperCase();

  return (
    <div className="px-5 md:px-8 lg:px-10 py-8 md:py-12 min-h-[70vh]">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0">
          {/* Avatar + identity */}
          <div className="flex items-center gap-3 px-3 pb-5 mb-3 border-b border-border">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-[14px] font-bold shrink-0">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-foreground truncate">{displayName}</p>
              {user?.email && (
                <p className="text-[11px] text-foreground-muted truncate">{user.email}</p>
              )}
            </div>
          </div>

          <nav aria-label="Account navigation" className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150",
                  pathname === href
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground-muted hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            ))}

            <button
              onClick={async () => { await logout(); router.push("/"); }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-foreground-muted hover:text-danger hover:bg-danger/5 transition-all mt-2"
            >
              <LogOut className="size-4 shrink-0" aria-hidden="true" />
              Sign Out
            </button>
          </nav>
        </aside>

        {/* Mobile nav — horizontal scroll */}
        <nav
          aria-label="Account navigation"
          className="lg:hidden flex gap-1.5 overflow-x-auto pb-1 w-full"
        >
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all shrink-0",
                pathname === href
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-foreground-muted hover:border-primary hover:text-foreground",
              )}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <button
            onClick={async () => { await logout(); router.push("/"); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap border border-border text-foreground-muted hover:text-danger hover:border-danger/30 transition-all shrink-0"
          >
            <LogOut className="size-3.5 shrink-0" aria-hidden="true" />
            Sign Out
          </button>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function AccountLayoutSkeleton() {
  return (
    <div className="px-5 md:px-8 lg:px-10 py-8 md:py-12" aria-hidden="true">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="hidden lg:flex flex-col gap-2 w-56 shrink-0">
          <Skeleton className="h-16 w-full rounded-2xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
        <div className="flex-1">
          <Skeleton className="h-8 w-40 mb-6" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
