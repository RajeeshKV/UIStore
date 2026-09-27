"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  MapPin,
  ShoppingBag,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthContext";
import { Skeleton } from "@/components/ui/Skeleton";

interface AccountLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: "Overview",  href: "/account",           icon: LayoutDashboard },
  { label: "Profile",   href: "/account/profile",   icon: User },
  { label: "Orders",    href: "/account/orders",    icon: ShoppingBag },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
] as const;

export function AccountLayout({ children }: AccountLayoutProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) return <AccountLayoutSkeleton />;
  if (!isAuthenticated) return null; // redirect in flight

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email ?? "My Account";

  return (
    <div className="container-x mx-auto py-8 md:py-12 min-h-[70vh]">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex flex-col gap-1 w-52 shrink-0">
          {/* User identity */}
          <div className="px-3 pb-4 mb-2 border-b border-border">
            <p className="text-label font-semibold text-foreground truncate">{displayName}</p>
            {user?.email && (
              <p className="text-caption text-foreground-muted truncate">{user.email}</p>
            )}
          </div>

          <nav aria-label="Account navigation">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-body-sm transition-colors",
                  pathname === href
                    ? "bg-muted font-medium text-foreground"
                    : "text-foreground-muted hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            ))}

            <button
              onClick={async () => { await logout(); router.push("/"); }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-md text-body-sm text-foreground-muted hover:text-danger hover:bg-danger/5 transition-colors mt-2"
            >
              <LogOut className="size-4 shrink-0" aria-hidden="true" />
              Sign Out
            </button>
          </nav>
        </aside>

        {/* Mobile nav */}
        <nav
          aria-label="Account navigation"
          className="lg:hidden flex gap-1 overflow-x-auto pb-1 w-full"
        >
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-md text-body-sm whitespace-nowrap transition-colors shrink-0",
                pathname === href
                  ? "bg-muted font-medium text-foreground"
                  : "text-foreground-muted hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <button
            onClick={async () => { await logout(); router.push("/"); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-body-sm whitespace-nowrap text-foreground-muted hover:text-danger hover:bg-danger/5 transition-colors shrink-0"
          >
            <LogOut className="size-3.5 shrink-0" aria-hidden="true" />
            Sign Out
          </button>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

function AccountLayoutSkeleton() {
  return (
    <div className="container-x mx-auto py-8 md:py-12" aria-hidden="true">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="hidden lg:flex flex-col gap-2 w-52 shrink-0">
          <Skeleton className="h-10 w-full rounded-md" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
        <div className="flex-1">
          <Skeleton className="h-8 w-40 mb-6" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
