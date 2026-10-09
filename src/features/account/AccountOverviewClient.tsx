"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, MapPin, User, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthContext";
import { ordersApi } from "@/services/api/orders";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderSummaryResponse } from "@/types/api";

interface AccountOverviewClientProps {
  currency: string;
  locale: string;
}

export function AccountOverviewClient({ currency, locale }: AccountOverviewClientProps) {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<OrderSummaryResponse[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const result = await ordersApi.list(1, 3);
      if (result.ok) setRecentOrders(result.data.items ?? []);
      setOrdersLoading(false);
    };
    void fetch();
  }, []);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email ?? "there";

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <div>
        <h1 className="text-[26px] font-extrabold text-foreground tracking-tight">Hello, {displayName}</h1>
        <p className="mt-1.5 text-[13px] text-foreground-muted">
          Manage your orders, addresses, and profile settings.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: "/account/profile", icon: User, label: "Edit Profile", desc: "Update your details" },
          { href: "/account/orders", icon: ShoppingBag, label: "My Orders", desc: "Track and manage orders" },
          { href: "/account/addresses", icon: MapPin, label: "Addresses", desc: "Manage saved addresses" },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-start gap-3 p-4 rounded-2xl border border-border bg-surface-elevated",
              "hover:border-border-strong hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all",
              "focus-visible:outline-2 focus-visible:outline-primary",
            )}
          >
            <span className="rounded-xl bg-muted border border-border p-2.5 shrink-0">
              <Icon className="size-4 text-foreground" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[13px] font-bold text-foreground">{label}</p>
              <p className="text-[12px] text-foreground-muted">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold text-foreground">Recent Orders</h2>
          <Link href="/account/orders" className="text-[13px] text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
            View all <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-4 text-center rounded-2xl border border-border bg-background">
            <div className="rounded-2xl bg-muted border border-border p-4">
              <ShoppingBag className="size-7 text-foreground-muted" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-foreground">No orders yet</p>
              <p className="text-[12px] text-foreground-muted mt-1">Your orders will appear here.</p>
            </div>
            <Link href="/shop"><Button variant="secondary" size="sm" className="rounded-full">Continue Shopping</Button></Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className={cn(
                  "flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-surface-elevated",
                  "hover:border-border-strong hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all",
                )}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-[13px] font-bold text-foreground">
                    Order #{order.orderNumber ?? order.id.slice(0, 8)}
                  </p>
                  <p className="text-[12px] text-foreground-muted">
                    {new Date(order.createdAtUtc).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <OrderStatusBadge status={order.status} />
                  <p className="text-[14px] font-extrabold text-foreground tabular-nums">
                    {formatPrice(order.grandTotal, order.currency ?? currency, locale)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
