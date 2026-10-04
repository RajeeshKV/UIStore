"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Package, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { ordersApi } from "@/services/api/orders";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { extractApiError } from "@/lib/utils";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderResponse } from "@/types/api";

interface OrderDetailClientProps {
  orderId: string;
  currency: string;
  locale: string;
}

export function OrderDetailClient({ orderId, currency, locale }: OrderDetailClientProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  /** §3 CONCURRENCY_CONFLICT: show retryable notice */
  const [concurrencyNote, setConcurrencyNote] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await ordersApi.get(orderId);
    if (result.ok) {
      setOrder(result.data);
    } else if ("error" in result && "status" in result.error && result.error.status === 404) {
      setNotFound(true);
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    const fetch = async () => { await load(); };
    void fetch();
  }, [load]);

  async function handleCancel() {
    setCancelling(true);
    const result = await ordersApi.cancel(orderId);
    setCancelOpen(false);

    // §1.11: 409 REFUND_FAILED — the order is genuinely still live.
    // Do NOT mark it cancelled; show the server's message as-is.
    if (!result.ok) {
      const err = result.error as { code?: string; message?: string; status?: number };

      if (err?.code === "REFUND_FAILED") {
        toastError(
          "Refund failed",
          err.message ?? "Your refund could not be processed. The order remains active. Please contact support.",
        );
        setCancelling(false);
        return;
      }

      // §3 INVENTORY_RESTORE_FAILED: order NOT cancelled, stock not returned.
      if (err?.code === "INVENTORY_RESTORE_FAILED") {
        toastError(
          "Cancellation failed",
          err.message ?? "Stock could not be restored. Your order was NOT cancelled. Please contact support.",
        );
        setCancelling(false);
        return;
      }

      // §3 CONCURRENCY_CONFLICT: retryable — refresh then let customer retry.
      if (err?.code === "CONCURRENCY_CONFLICT") {
        setConcurrencyNote(true);
        await load();
        setCancelling(false);
        return;
      }

      toastError("Cancellation failed", extractApiError(result.error));
      setCancelling(false);
      return;
    }

    // §1.11: 200 means refund accepted by provider, NOT that funds have landed.
    // Refunds typically settle in 5–7 business days.
    if (result.data) {
      setOrder(result.data);
    } else {
      await load();
    }
    toastSuccess(
      "Refund initiated",
      "Your order has been cancelled. Refunds typically settle within 5–7 business days.",
    );
    setCancelling(false);
  }

  if (loading) return <OrderDetailSkeleton />;

  if (notFound || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-h4 font-semibold text-foreground">Order not found</p>
        <p className="text-body-sm text-foreground-muted mt-2">
          This order may belong to a different account.
        </p>
        <Link href="/account/orders" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const effectiveCurrency = order.currency ?? currency;
  // Cancel allowed for PendingPayment and Confirmed only
  // (backend returns 409 CANNOT_CANCEL for Processing or later).
  // §1.10: Cancelled orders can later become Refunded — both are "money-returned" states.
  const canCancel = order.status === "PendingPayment" || order.status === "Confirmed";
  const isMoneyReturned = order.status === "Refunded";
  // §1.10: Cancelled → Refunded is now reachable — a previously-cancelled order
  // can show as Refunded once the provider confirms settlement.
  const wasCancelledNowRefunded = isMoneyReturned;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Back link */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to Orders
      </Link>

      {/* §3 Concurrency note: order refreshed, customer can retry */}
      {concurrencyNote && (
        <div role="alert" className="flex items-start gap-3 rounded-lg bg-warning/5 border border-warning/20 px-4 py-3 text-body-sm text-foreground">
          <span className="flex-1">Your order was updated. The page has been refreshed — please review and try again if needed.</span>
          <button onClick={() => setConcurrencyNote(false)} className="text-foreground-muted hover:text-foreground shrink-0">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-h3 font-bold text-foreground">
            Order #{order.orderNumber ?? orderId.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-caption text-foreground-muted mt-1">
            Placed {new Date(order.createdAtUtc).toLocaleDateString("en-IN", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <OrderStatusBadge status={order.status} />
          {/* §1.10: show refund notice for any Refunded order (incl. Cancelled→Refunded path) */}
          {wasCancelledNowRefunded && (
            <span className="text-caption text-foreground-muted">
              Refund issued — funds arrive within 5–7 business days
            </span>
          )}
          {canCancel && (
            <button
              onClick={() => setCancelOpen(true)}
              className="flex items-center gap-1 text-caption text-foreground-muted hover:text-danger transition-colors"
              aria-label="Cancel this order"
            >
              <XCircle className="size-3.5" aria-hidden="true" />
              Cancel order
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-border bg-surface-elevated overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Package className="size-4 text-foreground-muted" aria-hidden="true" />
          <h2 className="text-body-sm font-semibold text-foreground">
            Items ({order.itemCount ?? (order.items?.length ?? 0)})
          </h2>
        </div>
        {order.items && order.items.length > 0 ? (
          <ul>
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-4 border-b border-border last:border-none">
                {/* Thumbnail */}
                {item.primaryImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.primaryImageUrl}
                    alt={item.productName ?? "Product"}
                    className="h-14 w-14 rounded-lg object-cover bg-muted shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                    <Package className="size-5 text-foreground-muted" aria-hidden="true" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-foreground line-clamp-2">
                    {item.productName}
                  </p>
                  {item.variantDescription && <p className="text-caption text-foreground-muted">{item.variantDescription}</p>}
                  {item.sku && <p className="text-caption text-foreground-muted">SKU: {item.sku}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-caption text-foreground-muted">×{item.quantity}</p>
                  <p className="text-body-sm font-semibold text-foreground tabular-nums">
                    {formatPrice(item.lineTotal, effectiveCurrency, locale)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-4 text-body-sm text-foreground-muted">Item details not available.</p>
        )}
      </div>

      {/* Totals + Payment */}
      <div className="rounded-xl border border-border bg-surface-elevated p-5">
        <h2 className="text-body-sm font-semibold text-foreground mb-4">Order Summary</h2>
        <div className="flex flex-col gap-2 text-body-sm">
          {order.discountAmount > 0 && (
            <TotalRow label="Discount" value={`−${formatPrice(order.discountAmount, effectiveCurrency, locale)}`} highlight />
          )}
          <TotalRow label="Shipping" value={formatPrice(order.shippingAmount, effectiveCurrency, locale)} />
          {order.taxAmount > 0 && (
            <TotalRow label="Tax" value={formatPrice(order.taxAmount, effectiveCurrency, locale)} />
          )}
          {order.codFee != null && order.codFee > 0 && (
            <TotalRow label="COD Fee" value={formatPrice(order.codFee, effectiveCurrency, locale)} />
          )}
          <div className="flex justify-between pt-3 border-t border-border text-body font-semibold">
            <span className="text-foreground">Total</span>
            <span className="text-foreground tabular-nums">{formatPrice(order.grandTotal, effectiveCurrency, locale)}</span>
          </div>
        </div>
        {order.paymentMethod && (
          <p className="mt-3 text-caption text-foreground-muted">
            Paid via <span className="font-medium text-foreground capitalize">{order.paymentMethod}</span>
          </p>
        )}
      </div>

      {/* Shipping address */}
      {order.shippingAddress && (
        <div className="rounded-xl border border-border bg-surface-elevated p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="size-4 text-foreground-muted" aria-hidden="true" />
            <h2 className="text-body-sm font-semibold text-foreground">Shipped To</h2>
          </div>
          <address className="not-italic text-body-sm text-foreground-muted leading-relaxed">
            <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
            <p>{[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(", ")}</p>
            <p>{order.shippingAddress.country}</p>
            {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
          </address>
        </div>
      )}

      {/* Remarks / Cancellation reason — shown when admin has provided one */}
      {order.cancellationReason && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <svg className="size-4 text-warning shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <h2 className="text-body-sm font-semibold text-foreground">Order Remarks</h2>
          </div>
          <p className="text-body-sm text-foreground-muted">{order.cancellationReason}</p>
        </div>
      )}

      {/* Cancellation confirmation */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel Order"
        size="max-w-sm"
      >
        <p className="text-body-sm text-foreground-muted mb-6">
          Are you sure you want to cancel Order #{order.orderNumber}?
          {order.paymentMethod === "Razorpay"
            ? " A refund will be initiated to your original payment method (5–7 business days)."
            : " This action may not be reversible."}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setCancelOpen(false)}>Keep Order</Button>
          <Button variant="danger" fullWidth loading={cancelling} onClick={handleCancel}>
            Cancel Order
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function TotalRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={cn("text-foreground-muted", highlight && "text-success")}>{label}</span>
      <span className={cn("font-medium tabular-nums", highlight ? "text-success" : "text-foreground")}>{value}</span>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl" aria-hidden="true">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}
