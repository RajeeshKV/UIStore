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
        <h1 className="text-h2 font-bold text-foreground">Hello, {displayName}</h1>
        <p className="mt-1 text-body-sm text-foreground-muted">
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
              "flex items-start gap-3 p-4 rounded-xl border border-border",
              "hover:border-border-strong hover:bg-muted/30 transition-colors",
              "focus-visible:outline-2 focus-visible:outline-focus",
            )}
          >
            <span className="rounded-lg bg-muted p-2 shrink-0">
              <Icon className="size-4 text-foreground" aria-hidden="true" />
            </span>
            <div>
              <p className="text-body-sm font-semibold text-foreground">{label}</p>
              <p className="text-caption text-foreground-muted">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h4 font-semibold text-foreground">Recent Orders</h2>
          <Link href="/account/orders" className="text-body-sm text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
            View all <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-4 text-center rounded-xl border border-border bg-surface">
            <ShoppingBag className="size-8 text-foreground-muted" aria-hidden="true" />
            <div>
              <p className="text-body-sm font-medium text-foreground">No orders yet</p>
              <p className="text-caption text-foreground-muted mt-1">Your orders will appear here.</p>
            </div>
            <Link href="/shop"><Button variant="outline" size="sm">Continue Shopping</Button></Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className={cn(
                  "flex items-center justify-between gap-4 p-4 rounded-lg border border-border",
                  "hover:border-border-strong hover:bg-muted/20 transition-colors",
                )}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-body-sm font-medium text-foreground">
                    Order #{order.orderNumber ?? order.id.slice(0, 8)}
                  </p>
                  <p className="text-caption text-foreground-muted">
                    {new Date(order.createdAtUtc).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <OrderStatusBadge status={order.status} />
                  <p className="text-body-sm font-semibold text-foreground tabular-nums">
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
