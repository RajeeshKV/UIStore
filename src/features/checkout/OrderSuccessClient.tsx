"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Package, MapPin, AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { checkoutApi } from "@/services/api/checkout";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { OrderResponse } from "@/types/api";

interface OrderSuccessClientProps {
  orderId: string;
  currency: string;
  locale: string;
}

export function OrderSuccessClient({ orderId, currency, locale }: OrderSuccessClientProps) {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const result = await checkoutApi.getOrder(orderId);
      if (result.ok) {
        setOrder(result.data);
      } else {
        setError("Could not load order details. Your order was placed — check your email for confirmation.");
      }
      setLoading(false);
    };
    void load();
  }, [orderId]);

  if (loading) return <OrderSuccessSkeleton />;

  const effectiveCurrency = order?.currency ?? currency;

  return (
    <div className="container-x mx-auto py-12 md:py-16 max-w-2xl min-h-[60vh]">
      {/* Success header */}
      <div className="flex flex-col items-center text-center gap-4 mb-10">
        <div className="rounded-full bg-success/10 p-5">
          <CheckCircle className="size-10 text-success" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-h2 font-bold text-foreground">Order Confirmed!</h1>
          {order?.orderNumber && (
            <p className="mt-2 text-body text-foreground-muted">
              Order <span className="font-semibold text-foreground">#{order.orderNumber}</span>
            </p>
          )}
          <p className="mt-1 text-body-sm text-foreground-muted">
            Thank you for your purchase. We&apos;ll send you updates by email.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 mb-6">
          <AlertTriangle className="size-4 text-warning mt-0.5 shrink-0" />
          <p className="text-body-sm text-foreground">{error}</p>
        </div>
      )}

      {order && (
        <div className="flex flex-col gap-6">
          {/* Order summary */}
          <div className="rounded-xl border border-border bg-surface-elevated p-6">
            <h2 className="text-h4 font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="size-4" aria-hidden="true" /> Order Details
            </h2>

            {/* Items */}
            {order.items && order.items.length > 0 && (
              <ul className="flex flex-col gap-3 mb-4">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-foreground truncate">{item.productName}</p>
                      {item.variantDescription && <p className="text-caption text-foreground-muted">{item.variantDescription}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-body-sm text-foreground-muted">×{item.quantity}</p>
                      <p className="text-body-sm font-medium text-foreground tabular-nums">
                        {formatPrice(item.lineTotal, effectiveCurrency, locale)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Totals */}
            <div className="flex flex-col gap-1.5 text-body-sm border-t border-border pt-4">
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Discount</span>
                  <span className="text-success font-medium tabular-nums">−{formatPrice(order.discountAmount, effectiveCurrency, locale)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-foreground-muted">Shipping</span>
                <span className="text-foreground font-medium tabular-nums">{formatPrice(order.shippingAmount, effectiveCurrency, locale)}</span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Tax</span>
                  <span className="text-foreground font-medium tabular-nums">{formatPrice(order.taxAmount, effectiveCurrency, locale)}</span>
                </div>
              )}
              {order.codFee != null && order.codFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground-muted">COD Fee</span>
                  <span className="text-foreground font-medium tabular-nums">{formatPrice(order.codFee, effectiveCurrency, locale)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border text-body font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-foreground tabular-nums">{formatPrice(order.grandTotal, effectiveCurrency, locale)}</span>
              </div>
            </div>

            {/* Payment method + status */}
            <div className="mt-4 flex flex-wrap gap-3 text-caption text-foreground-muted">
              {order.paymentMethod && (
                <span>Payment: <span className="text-foreground font-medium capitalize">{order.paymentMethod}</span></span>
              )}
              {order.status && (
                <span>Status: <span className="text-foreground font-medium capitalize">{order.status}</span></span>
              )}
            </div>
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div className="rounded-xl border border-border bg-surface-elevated p-6">
              <h2 className="text-h4 font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="size-4" aria-hidden="true" /> Shipping To
              </h2>
              <address className="not-italic text-body-sm text-foreground-muted leading-relaxed">
                <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
              </address>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/shop">
          <Button variant="primary" size="lg">Continue Shopping</Button>
        </Link>
        <Link href="/account/orders">
          <Button variant="outline" size="lg">View My Orders</Button>
        </Link>
      </div>
    </div>
  );
}

function OrderSuccessSkeleton() {
  return (
    <div className="container-x mx-auto py-12 max-w-2xl" aria-hidden="true">
      <div className="flex flex-col items-center gap-4 mb-10">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
