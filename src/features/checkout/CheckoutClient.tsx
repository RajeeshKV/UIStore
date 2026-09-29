"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Tag, X, Truck, CreditCard, Banknote, CheckCircle } from "lucide-react";
import { cn, formatPrice, extractApiError } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthContext";
import { useCart } from "@/features/cart/CartContext";
import { checkoutApi } from "@/services/api/checkout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { loadRazorpayScript, openRazorpay } from "@/lib/razorpay";
import type { ShippingAddressDto, CouponValidationResponse } from "@/types/api";

// Simple UUID alternative without dependency
function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface CheckoutClientProps {
  currency: string;
  locale: string;
  storeName: string;
  codEnabled: boolean;
  freeShippingThreshold?: number;
  flatDeliveryFee: number;
  codExtraFee: number;
}

type PaymentMethod = "Razorpay" | "CashOnDelivery";
type CheckoutStep = "idle" | "placing" | "razorpay_loading" | "razorpay_open" | "verifying" | "success" | "failed";

// ── Address form shape ────────────────────────────────────────────────────────

function emptyAddress(): ShippingAddressDto {
  return { fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "IN" };
}

function validateAddress(a: ShippingAddressDto): Record<string, string> {
  const e: Record<string, string> = {};
  if (!a.fullName?.trim()) e.fullName = "Full name is required.";
  if (!a.phone?.trim()) e.phone = "Phone number is required.";
  if (!a.addressLine1?.trim()) e.addressLine1 = "Address is required.";
  if (!a.city?.trim()) e.city = "City is required.";
  if (!a.state?.trim()) e.state = "State is required.";
  if (!a.postalCode?.trim()) e.postalCode = "Postal code is required.";
  if (!a.country?.trim()) e.country = "Country is required.";
  return e;
}

export function CheckoutClient({
  currency,
  locale,
  storeName,
  codEnabled,
  freeShippingThreshold,
  flatDeliveryFee,
  codExtraFee,
}: CheckoutClientProps) {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { cart, isLoading: cartLoading, refresh: refreshCart } = useCart();
  const router = useRouter();

  const [address, setAddress] = useState<ShippingAddressDto>(emptyAddress());
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Razorpay");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponValidationResponse | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [step, setStep] = useState<CheckoutStep>("idle");
  const [stepError, setStepError] = useState("");
  const idempotencyRef = useRef(generateIdempotencyKey());

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const effectiveCurrency = cart?.currency ?? currency;

  // Estimated shipping (display only — backend is authoritative at checkout)
  const estimatedShipping =
    freeShippingThreshold != null && subtotal >= freeShippingThreshold
      ? 0
      : flatDeliveryFee;
  const estimatedCod = paymentMethod === "CashOnDelivery" ? codExtraFee : 0;
  const couponDiscount = coupon?.isValid ? coupon.discountAmount : 0;

  // ── Coupon ─────────────────────────────────────────────────────────────────
  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    const result = await checkoutApi.validateCoupon({ couponCode: couponCode.trim() });
    setCouponLoading(false);
    if (result.ok) {
      if (result.data.isValid) {
        setCoupon(result.data);
      } else {
        setCoupon(null);
        setCouponError(result.data.errorMessage ?? "Invalid or expired coupon.");
      }
    } else {
      setCoupon(null);
      setCouponError("Could not validate coupon. Please try again.");
    }
  }, [couponCode]);

  const handleRemoveCoupon = useCallback(() => {
    setCoupon(null);
    setCouponCode("");
    setCouponError("");
  }, []);

  // ── Place order ────────────────────────────────────────────────────────────
  const handlePlaceOrder = useCallback(async () => {
    if (step !== "idle" && step !== "failed") return;

    const addrErrors = validateAddress(address);
    if (Object.keys(addrErrors).length) {
      setAddressErrors(addrErrors);
      return;
    }
    setAddressErrors({});
    setStepError("");
    setStep("placing");

    const result = await checkoutApi.placeOrder({
      shippingAddress: address,
      paymentMethod,
      couponCode: coupon?.isValid ? coupon.couponCode ?? undefined : undefined,
      idempotencyKey: idempotencyRef.current,
    });

    if (!result.ok) {
      const msg = extractApiError(result.error, "Could not place order.");
      setStepError(msg);
      setStep("failed");
      // Refresh cart in case stock changed
      await refreshCart();
      return;
    }

    const checkout = result.data;

    if (paymentMethod === "CashOnDelivery") {
      // COD: no payment step needed
      setStep("success");
      router.push(`/order-success/${checkout.orderId}`);
      return;
    }

    // Razorpay online payment
    if (!checkout.providerOrderId || !checkout.razorpayKeyId) {
      setStepError("Payment gateway not configured. Please try COD or contact support.");
      setStep("failed");
      return;
    }

    setStep("razorpay_loading");
    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded) {
      setStepError("Payment SDK failed to load. Check your connection and try again.");
      setStep("failed");
      return;
    }

    setStep("razorpay_open");
    const orderId = checkout.orderId;

    openRazorpay({
      key: checkout.razorpayKeyId,
      amount: Math.round(checkout.grandTotal * 100), // paise
      currency: checkout.currency ?? effectiveCurrency,
      name: storeName,
      description: `Order #${checkout.orderNumber ?? orderId}`,
      order_id: checkout.providerOrderId,
      prefill: {
        name: user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : undefined,
        email: user?.email,
        contact: address.phone || user?.phoneNumber,
      },
      theme: { color: "#09090b" },
      handler: async (response) => {
        setStep("verifying");
        const verifyResult = await checkoutApi.verifyPayment(orderId, {
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        });
        if (verifyResult.ok) {
          setStep("success");
          router.push(`/order-success/${orderId}`);
        } else {
          setStepError("Payment verification failed. Please contact support with your order ID: " + orderId);
          setStep("failed");
        }
      },
      modal: {
        ondismiss: () => {
          // User closed Razorpay — order exists but unpaid; allow retry
          setStepError("Payment was cancelled. Your cart is saved. You can retry.");
          setStep("failed");
          // New idempotency key for a fresh attempt
          idempotencyRef.current = generateIdempotencyKey();
        },
      },
    });
  }, [step, address, paymentMethod, coupon, router, refreshCart, user, storeName, effectiveCurrency]);

  // ── Loading states ─────────────────────────────────────────────────────────
  if (authLoading || cartLoading) return <CheckoutSkeleton />;

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="container-x mx-auto py-16 max-w-lg text-center min-h-[60vh]">
        <p className="text-h4 font-semibold text-foreground">Sign in to checkout</p>
        <p className="mt-2 text-body-sm text-foreground-muted">You need an account to complete your purchase.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link href="/auth/login?redirect=/checkout">
            <Button variant="primary" size="lg">Sign In</Button>
          </Link>
          <Link href="/auth/register?redirect=/checkout">
            <Button variant="outline" size="lg">Create Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="container-x mx-auto py-16 max-w-lg text-center min-h-[60vh]">
        <ShoppingBag className="size-12 text-foreground-muted mx-auto mb-4" />
        <p className="text-h4 font-semibold text-foreground">Your cart is empty</p>
        <p className="mt-2 text-body-sm text-foreground-muted">Add some products before checking out.</p>
        <div className="mt-6">
          <Link href="/shop"><Button variant="primary" size="lg">Continue Shopping</Button></Link>
        </div>
      </div>
    );
  }

  const isProcessing = step === "placing" || step === "razorpay_loading" || step === "verifying";
  const stepLabel: Record<CheckoutStep, string> = {
    idle: "Place Order",
    placing: "Creating order…",
    razorpay_loading: "Loading payment…",
    razorpay_open: "Complete payment in popup",
    verifying: "Verifying payment…",
    success: "Order placed!",
    failed: paymentMethod === "Razorpay" ? "Retry Payment" : "Retry Order",
  };

  return (
    <div className="container-x mx-auto py-8 md:py-12">
      <h1 className="text-h2 font-bold text-foreground mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
        {/* ── LEFT: form ── */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Shipping address */}
          <section aria-labelledby="addr-heading">
            <h2 id="addr-heading" className="text-h4 font-semibold text-foreground mb-4 flex items-center gap-2">
              <Truck className="size-4" aria-hidden="true" /> Shipping Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Full Name" required value={address.fullName} onChange={(e) => setAddress(a => ({ ...a, fullName: e.target.value }))} error={addressErrors.fullName} autoComplete="name" />
              <Input label="Phone" type="tel" required value={address.phone} onChange={(e) => setAddress(a => ({ ...a, phone: e.target.value }))} error={addressErrors.phone} autoComplete="tel" />
              <div className="sm:col-span-2">
                <Input label="Address Line 1" required value={address.addressLine1} onChange={(e) => setAddress(a => ({ ...a, addressLine1: e.target.value }))} error={addressErrors.addressLine1} autoComplete="address-line1" />
              </div>
              <div className="sm:col-span-2">
                <Input label="Address Line 2 (optional)" value={address.addressLine2 ?? ""} onChange={(e) => setAddress(a => ({ ...a, addressLine2: e.target.value }))} autoComplete="address-line2" />
              </div>
              <Input label="City" required value={address.city} onChange={(e) => setAddress(a => ({ ...a, city: e.target.value }))} error={addressErrors.city} autoComplete="address-level2" />
              <Input label="State / Province" required value={address.state} onChange={(e) => setAddress(a => ({ ...a, state: e.target.value }))} error={addressErrors.state} autoComplete="address-level1" />
              <Input label="Postal Code" required value={address.postalCode} onChange={(e) => setAddress(a => ({ ...a, postalCode: e.target.value }))} error={addressErrors.postalCode} autoComplete="postal-code" />
              <Input label="Country" required value={address.country} onChange={(e) => setAddress(a => ({ ...a, country: e.target.value }))} error={addressErrors.country} autoComplete="country" />
            </div>
          </section>

          {/* Payment method */}
          <section aria-labelledby="pay-heading">
            <h2 id="pay-heading" className="text-h4 font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="size-4" aria-hidden="true" /> Payment Method
            </h2>
            <div className="flex flex-col gap-3" role="radiogroup" aria-label="Select payment method">
              <PaymentOption
                id="pm-razorpay"
                value="Razorpay"
                selected={paymentMethod === "Razorpay"}
                onSelect={() => setPaymentMethod("Razorpay")}
                icon={<CreditCard className="size-4" />}
                label="Pay Online"
                description="Cards, UPI, Net Banking, Wallets — powered by Razorpay"
              />
              {codEnabled && (
                <PaymentOption
                  id="pm-cod"
                  value="CashOnDelivery"
                  selected={paymentMethod === "CashOnDelivery"}
                  onSelect={() => setPaymentMethod("CashOnDelivery")}
                  icon={<Banknote className="size-4" />}
                  label="Cash on Delivery"
                  description={codExtraFee > 0 ? `+${formatPrice(codExtraFee, effectiveCurrency, locale)} COD fee` : "Pay when your order arrives"}
                />
              )}
            </div>
          </section>

          {/* Coupon */}
          <section aria-labelledby="coupon-heading">
            <h2 id="coupon-heading" className="text-h4 font-semibold text-foreground mb-4 flex items-center gap-2">
              <Tag className="size-4" aria-hidden="true" /> Coupon / Promo
            </h2>
            {coupon?.isValid ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-success/30 bg-success/5">
                <CheckCircle className="size-4 text-success shrink-0" />
                <div className="flex-1">
                  <p className="text-body-sm font-medium text-foreground">{coupon.couponCode}</p>
                  <p className="text-caption text-success">
                    {formatPrice(coupon.discountAmount, effectiveCurrency, locale)} discount applied
                  </p>
                </div>
                <button onClick={handleRemoveCoupon} aria-label="Remove coupon" className="text-foreground-muted hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value); setCouponError(""); }}
                    error={couponError}
                    aria-label="Coupon code"
                  />
                </div>
                <Button variant="outline" onClick={handleApplyCoupon} loading={couponLoading} disabled={!couponCode.trim()} className="shrink-0 self-start mt-0">
                  Apply
                </Button>
              </div>
            )}
          </section>
        </div>

        {/* ── RIGHT: summary ── */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-xl border border-border bg-surface-elevated p-6 flex flex-col gap-4">
            <h2 className="text-h4 font-semibold text-foreground">Order Summary</h2>

            {/* Items */}
            <ul className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-body-sm">
                  <span className="flex-1 truncate text-foreground">{item.productName}</span>
                  <span className="text-foreground-muted shrink-0">×{item.quantity}</span>
                  <span className="font-medium text-foreground shrink-0 tabular-nums">
                    {formatPrice(item.lineTotal, effectiveCurrency, locale)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2 text-body-sm border-t border-border pt-3">
              <SummaryRow label="Subtotal" value={formatPrice(subtotal, effectiveCurrency, locale)} />
              <SummaryRow
                label={estimatedShipping === 0 && freeShippingThreshold != null ? "Shipping (Free)" : "Shipping (est.)"}
                value={estimatedShipping === 0 ? "FREE" : formatPrice(estimatedShipping, effectiveCurrency, locale)}
                highlight={estimatedShipping === 0}
              />
              {couponDiscount > 0 && (
                <SummaryRow label="Discount" value={`−${formatPrice(couponDiscount, effectiveCurrency, locale)}`} highlight />
              )}
              {estimatedCod > 0 && (
                <SummaryRow label="COD Fee" value={formatPrice(estimatedCod, effectiveCurrency, locale)} />
              )}
              <SummaryRow label="Tax" value="Calculated at order" muted />
            </div>

            <p className="text-caption text-foreground-muted">
              Final total will be confirmed by the backend after placing your order.
            </p>

            {stepError && (
              <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-3 py-2">
                {stepError}
              </p>
            )}

            {step === "razorpay_open" && (
              <p className="text-body-sm text-foreground-muted text-center animate-pulse">
                Complete payment in the popup window…
              </p>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={isProcessing || step === "razorpay_open" || step === "success"}
              loading={isProcessing}
              onClick={handlePlaceOrder}
              aria-live="polite"
            >
              {stepLabel[step]}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PaymentOption({
  id, value, selected, onSelect, icon, label, description,
}: {
  id: string; value: string; selected: boolean;
  onSelect: () => void; icon: React.ReactNode;
  label: string; description: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
        selected ? "border-foreground bg-muted/30" : "border-border hover:border-border-strong",
      )}
    >
      <input
        id={id}
        type="radio"
        name="paymentMethod"
        value={value}
        checked={selected}
        onChange={onSelect}
        className="mt-0.5 accent-foreground"
      />
      <span className="mt-0.5 text-foreground-muted">{icon}</span>
      <div>
        <p className="text-body-sm font-medium text-foreground">{label}</p>
        <p className="text-caption text-foreground-muted">{description}</p>
      </div>
    </label>
  );
}

function SummaryRow({ label, value, highlight, muted }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={cn("text-foreground-muted", highlight && "text-success")}>{label}</span>
      <span className={cn("font-medium tabular-nums", highlight ? "text-success" : muted ? "text-foreground-muted" : "text-foreground")}>{value}</span>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="container-x mx-auto py-8 md:py-12" aria-hidden="true">
      <Skeleton className="h-8 w-36 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </div>
  );
}
