"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { adminOrdersApi } from "@/services/api/admin";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { ConfirmDialog } from "@/features/admin/AdminDialog";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatPrice , extractApiError } from "@/lib/utils";
import type { OrderResponse } from "@/types/api";

const ORDER_STATUSES = ["PendingPayment", "PaymentProcessing", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled", "Failed", "RefundPending", "Refunded"];

interface AdminOrderDetailClientProps {
  orderId: string;
}

export function AdminOrderDetailClient({ orderId }: AdminOrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingProvider, setTrackingProvider] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  /** §3 CONCURRENCY_CONFLICT: show retryable notice above the order */
  const [concurrencyNote, setConcurrencyNote] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminOrdersApi.getById(orderId);
    if (res.ok) {
      setOrder(res.data);
      setNewStatus(res.data.status ?? "");
    } else {
      setError(extractApiError(res.error, "Failed to load order."));
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => { void load(); }, [load]);

  async function handleUpdateStatus() {
    if (!newStatus) return;
    setUpdating(true);
    setUpdateError("");
    const res = await adminOrdersApi.updateStatus(orderId, {
      status: newStatus,
      trackingNumber: trackingNumber.trim() || undefined,
      trackingProvider: trackingProvider.trim() || undefined,
      reason: cancellationReason.trim() || undefined,
    });
    setUpdating(false);

    if (res.ok) {
      setStatusDialogOpen(false);
      setOrder(res.data);
      // §5 Refetch checklist: after Confirmed or Cancelled, stock moves. Re-load order
      // so any embedded stock data is fresh (order detail carries latest status).
      return;
    }

    const err = res.error as { code?: string; message?: string };
    const code = err?.code ?? "";

    // §3 CONCURRENCY_CONFLICT: two requests raced. Retryable — refetch and let admin retry.
    if (code === "CONCURRENCY_CONFLICT") {
      setStatusDialogOpen(false);
      setUpdateError("");
      setConcurrencyNote(true);
      await load();
      return;
    }

    // §3 INVENTORY_RESTORE_FAILED: order not cancelled, stock not returned. Operational error.
    if (code === "INVENTORY_RESTORE_FAILED") {
      setUpdateError(
        err.message ??
        "Stock could not be returned. The order was NOT cancelled. Please reconcile inventory manually before retrying."
      );
      return;
    }

    setUpdateError(extractApiError(res.error, "Update failed."));
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !order) {
    return <ErrorState title="Order not found" description={error ?? "This order could not be loaded."} onRetry={load} />;
  }

  const currency = order.currency ?? "INR";

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* §3 Concurrency notice */}
        {concurrencyNote && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-lg bg-warning/5 border border-warning/20 px-4 py-3 text-body-sm text-foreground">
            <span>Order was updated by another session. The data below is now refreshed — you can retry the status change.</span>
            <button onClick={() => setConcurrencyNote(false)} className="shrink-0 text-foreground-muted hover:text-foreground">✕</button>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/orders")}
            aria-label="Back to orders"
            className="h-8 w-8 flex items-center justify-center rounded-md text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-h3 font-bold text-foreground">
                Order #{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}
              </h2>
              <AdminStatusBadge status={order.status ?? "pending"} />
            </div>
            <p className="text-body-sm text-foreground-muted mt-0.5">
              {new Date(order.createdAtUtc).toLocaleString("en-IN")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(true)}>
            Update Status
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Order items */}
          <div className="lg:col-span-2 rounded-lg border border-border bg-background overflow-hidden">
            <div className="border-b border-border px-5 py-3">
              <h3 className="text-body font-semibold text-foreground">Items</h3>
            </div>
            <div className="divide-y divide-border">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-start gap-4 px-5 py-4">
                  {/* Item image */}
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-muted overflow-hidden border border-border">
                    {item.primaryImageUrl ? (
                      <img
                        src={item.primaryImageUrl}
                        alt={item.productName ?? "Product"}
                        className="h-full w-full object-contain p-1"
                        loading="lazy"
                      />
                    ) : (
                      <Package className="size-5 text-foreground-muted" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-foreground">{item.productName ?? "Product"}</p>

                    {/* Variant attributes — structured first, fall back to description */}
                    {item.variantAttributes && item.variantAttributes.length > 0 ? (
                      <p className="text-caption text-foreground-muted mt-0.5">
                        {item.variantAttributes.map((a) => `${a.attributeName}: ${a.value}`).join(" · ")}
                      </p>
                    ) : item.variantDescription ? (
                      <p className="text-caption text-foreground-muted mt-0.5">{item.variantDescription}</p>
                    ) : null}

                    {item.sku && (
                      <p className="text-caption text-foreground-muted">SKU: {item.sku}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-body-sm text-foreground-muted">
                      {formatPrice(item.unitPrice, currency)} × {item.quantity}
                    </p>
                    <p className="text-body-sm font-semibold text-foreground">
                      {formatPrice(item.lineTotal, currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary + address */}
          <div className="flex flex-col gap-6">
            {/* Totals */}
            <div className="rounded-lg border border-border bg-background p-5">
              <h3 className="text-body font-semibold text-foreground border-b border-border pb-3 mb-4">Summary</h3>
              <dl className="flex flex-col gap-2 text-body-sm">
                <div className="flex justify-between">
                  <dt className="text-foreground-muted">Payment</dt>
                  <dd className="text-foreground capitalize">{order.paymentMethod ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground-muted">Subtotal</dt>
                  <dd className="text-foreground">{formatPrice(order.subtotal ?? (order.grandTotal - order.shippingAmount - order.taxAmount - (order.codFee ?? 0) + order.discountAmount), currency)}</dd>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-foreground-muted">Discount</dt>
                    <dd className="text-success">−{formatPrice(order.discountAmount, currency)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-foreground-muted">Shipping</dt>
                  <dd className="text-foreground">{formatPrice(order.shippingAmount, currency)}</dd>
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-foreground-muted">Tax</dt>
                    <dd className="text-foreground">{formatPrice(order.taxAmount, currency)}</dd>
                  </div>
                )}
                {order.codFee != null && order.codFee > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-foreground-muted">COD fee</dt>
                    <dd className="text-foreground">{formatPrice(order.codFee, currency)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <dt className="text-foreground">Total</dt>
                  <dd className="text-foreground">{formatPrice(order.grandTotal, currency)}</dd>
                </div>
              </dl>
            </div>

            {/* Shipping address */}
            {order.shippingAddress && (
              <div className="rounded-lg border border-border bg-background p-5">
                <h3 className="text-body font-semibold text-foreground border-b border-border pb-3 mb-3">Shipping Address</h3>
                <address className="not-italic text-body-sm text-foreground-muted leading-relaxed">
                  {order.shippingAddress.fullName && <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>}
                  {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
                  {order.shippingAddress.addressLine1 && <p>{order.shippingAddress.addressLine1}</p>}
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  {(order.shippingAddress.city || order.shippingAddress.state) && (
                    <p>{[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(", ")}</p>
                  )}
                  {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                </address>
              </div>
            )}

            {/* Tracking */}
            {(order.trackingNumber || order.trackingProvider) && (
              <div className="rounded-lg border border-border bg-background p-5">
                <h3 className="text-body font-semibold text-foreground border-b border-border pb-3 mb-3">Tracking</h3>
                <dl className="text-body-sm flex flex-col gap-1">
                  {order.trackingProvider && (
                    <div className="flex gap-2">
                      <dt className="text-foreground-muted">Provider:</dt>
                      <dd className="text-foreground">{order.trackingProvider}</dd>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div className="flex gap-2">
                      <dt className="text-foreground-muted">Number:</dt>
                      <dd className="text-foreground font-mono">{order.trackingNumber}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Cancellation / Remarks */}
            {order.cancellationReason && (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-5">
                <h3 className="text-body font-semibold text-foreground border-b border-warning/20 pb-3 mb-3">Remarks</h3>
                <p className="text-body-sm text-foreground">{order.cancellationReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status update dialog */}
      <ConfirmDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onConfirm={handleUpdateStatus}
        title="Update order status"
        description=""
        confirmLabel="Update"
        confirmVariant="primary"
        loading={updating}
      >
        <div className="flex flex-col gap-4 -mt-2">
          {updateError && (
            <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">{updateError}</p>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-foreground">New status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              aria-label="Order status"
              className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-foreground">Tracking number (optional)</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              aria-label="Tracking number"
              className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-foreground">Tracking provider (optional)</label>
            <input
              type="text"
              value={trackingProvider}
              onChange={(e) => setTrackingProvider(e.target.value)}
              placeholder="e.g. Delhivery, DTDC"
              aria-label="Tracking provider"
              className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus"
            />
          </div>
          {/* Remarks / Reason — available for all status changes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-foreground">
              Remarks / Reason (optional)
            </label>
            <input
              type="text"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation, damaged in transit…"
              aria-label="Remarks or reason"
              className="h-9 px-3 rounded-md border border-border bg-background text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus"
            />
            <p className="text-caption text-foreground-muted">
              Shown to the customer in their order detail if provided.
            </p>
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}
