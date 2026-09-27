"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { ordersApi } from "@/services/api/orders";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderSummaryResponse } from "@/types/api";

interface OrdersClientProps {
  currency: string;
  locale: string;
}

const PAGE_SIZE = 10;

export function OrdersClient({ currency, locale }: OrdersClientProps) {
  const [orders, setOrders] = useState<OrderSummaryResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(false);
    const result = await ordersApi.list(p, PAGE_SIZE);
    if (result.ok) {
      setOrders(result.data.items ?? []);
      setTotalPages(result.data.totalPages);
      setTotalCount(result.data.totalCount);
    } else {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetch = async () => { await load(page); };
    void fetch();
  }, [load, page]);

  function handlePageChange(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-h3 font-bold text-foreground">My Orders</h1>
        {!loading && !error && totalCount > 0 && (
          <p className="text-body-sm text-foreground-muted">{totalCount} order{totalCount !== 1 ? "s" : ""}</p>
        )}
      </div>

      {loading && <OrderListSkeleton />}

      {error && !loading && (
        <ErrorState
          title="Couldn't load orders"
          description="Something went wrong. Please try again."
          onRetry={() => load(page)}
        />
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center py-12 gap-4 text-center rounded-xl border border-border bg-surface">
          <ShoppingBag className="size-8 text-foreground-muted" aria-hidden="true" />
          <div>
            <p className="text-body-sm font-medium text-foreground">No orders yet</p>
            <p className="text-caption text-foreground-muted mt-1">Your orders will appear here once you make a purchase.</p>
          </div>
          <Link href="/shop"><Button variant="outline" size="sm">Start Shopping</Button></Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border border-border",
                  "hover:border-border-strong hover:bg-muted/20 transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-focus",
                )}
              >
                {/* Date + number */}
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <p className="text-body-sm font-semibold text-foreground">
                    Order #{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-caption text-foreground-muted">
                    {new Date(order.createdAtUtc).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                    {" · "}{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Status + total */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <OrderStatusBadge status={order.status} />
                  <p className="text-body-sm font-semibold text-foreground tabular-nums">
                    {formatPrice(order.grandTotal, order.currency ?? currency, locale)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
}

function OrderListSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}
