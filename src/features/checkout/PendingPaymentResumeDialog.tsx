"use client";

/**
 * PendingPaymentResumeDialog
 *
 * Mounted globally in StorefrontLayout. On every app launch it checks
 * localStorage for a persisted checkout response. If one is found it calls
 * GET /orders/{id} to confirm the order is still "PendingPayment", then
 * offers the user two options:
 *   - Resume Payment  → reopen Razorpay with the saved providerOrderId
 *   - Cancel Order    → POST /api/v1/orders/{id}/cancel → clear storage
 *
 * If the order is already Confirmed / Cancelled / etc. the persisted entry
 * is silently cleared.
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, XCircle, CreditCard } from "lucide-react";
import { pendingPaymentStore, type PersistedCheckout } from "@/lib/pendingPayment";
import { ordersApi } from "@/services/api/orders";
import { checkoutApi } from "@/services/api/checkout";
import { loadRazorpayScript, openRazorpay } from "@/lib/razorpay";
import { useAuth } from "@/features/auth/AuthContext";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function PendingPaymentResumeDialog() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  const [pending, setPending] = useState<PersistedCheckout | null>(null);
  const [checking, setChecking] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // On auth ready, check for a persisted pending payment
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      // Not logged in — clear any stale entry (logged-out users can't pay)
      pendingPaymentStore.clear();
      return;
    }

    const entry = pendingPaymentStore.load();
    if (!entry) return;

    // Verify the order is still actually PendingPayment
    setChecking(true);
    ordersApi.get(entry.orderId).then((result) => {
      if (result.ok && result.data.status === "PendingPayment") {
        setPending(entry);
      } else {
        // Order moved on (confirmed, cancelled, expired) — clear stale entry
        pendingPaymentStore.clear();
      }
      setChecking(false);
    });
  }, [isAuthenticated, authLoading]);

  const handleResume = useCallback(async () => {
    if (!pending) return;
    setResuming(true);

    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded) {
      setResuming(false);
      return;
    }

    openRazorpay({
      key: pending.razorpayKeyId,
      amount: Math.round(pending.grandTotal * 100),
      currency: pending.currency,
      name: "Shopey",
      description: `Order #${pending.orderNumber ?? pending.orderId}`,
      order_id: pending.providerOrderId,
      prefill: {
        email: user?.email,
      },
      theme: { color: "#09090b" },
      handler: async (response) => {
        const verifyResult = await checkoutApi.verifyPayment(pending.orderId, {
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        });
        if (verifyResult.ok) {
          pendingPaymentStore.clear();
          setPending(null);
          router.push(`/order-success/${pending.orderId}`);
        } else {
          // Payment captured but verify failed — instruct support contact
          pendingPaymentStore.clear();
          setPending(null);
          alert(
            `Payment could not be verified. Please contact support with order number: ${pending.orderNumber ?? pending.orderId}`,
          );
        }
      },
      modal: {
        ondismiss: () => {
          setResuming(false);
          // Keep pending state — user can retry again
        },
      },
    });
  }, [pending, user, router]);

  const handleCancel = useCallback(async () => {
    if (!pending) return;
    setCancelling(true);
    await ordersApi.cancel(pending.orderId, "Customer cancelled pending payment on resume");
    pendingPaymentStore.clear();
    setPending(null);
    setCancelling(false);
  }, [pending]);

  // Nothing to show while checking or if no pending payment
  if (authLoading || checking || !pending) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-dialog-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background shadow-2xl p-6 flex flex-col gap-5">
        {/* Icon + heading */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-warning/10 p-4">
            <CreditCard className="size-7 text-warning" aria-hidden="true" />
          </div>
          <div>
            <p id="resume-dialog-title" className="text-h4 font-bold text-foreground">
              Unpaid Order Found
            </p>
            <p className="mt-1 text-body-sm text-foreground-muted">
              You have an incomplete payment for order{" "}
              <span className="font-semibold text-foreground">
                #{pending.orderNumber ?? pending.orderId.slice(0, 8)}
              </span>
            </p>
            <p className="mt-1 text-body-sm font-semibold text-foreground">
              {formatPrice(pending.grandTotal, pending.currency)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={resuming}
            onClick={handleResume}
            iconLeft={<RefreshCw className="size-4" />}
          >
            Resume Payment
          </Button>
          <Button
            variant="outline"
            size="lg"
            fullWidth
            loading={cancelling}
            onClick={handleCancel}
            iconLeft={<XCircle className="size-4" />}
          >
            Cancel Order
          </Button>
        </div>
      </div>
    </div>
  );
}
