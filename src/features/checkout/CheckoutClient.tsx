"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag, Tag, X, Truck, CreditCard, Banknote, CheckCircle,
  Plus, Star, AlertTriangle, RefreshCw, XCircle,
} from "lucide-react";
import { cn, formatPrice, extractApiError } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthContext";
import { useCart } from "@/features/cart/CartContext";
import { checkoutApi } from "@/services/api/checkout";
import { ordersApi } from "@/services/api/orders";
import { addressesApi } from "@/services/api/addresses";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { AddressForm } from "@/features/account/AddressForm";
import { loadRazorpayScript, openRazorpay } from "@/lib/razorpay";
import { pendingPaymentStore } from "@/lib/pendingPayment";
import type {
  CustomerAddressResponse,
  CouponValidationResponse,
  CreateAddressRequest,
  CheckoutResponse,
} from "@/types/api";

// ── UUID v4 ───────────────────────────────────────────────────────────────────
function generateIdempotencyKey(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Inline address form ───────────────────────────────────────────────────────
interface InlineAddressForm {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
}

function emptyInlineAddress(): InlineAddressForm {
  return {
    firstName: "", lastName: "", phone: "",
    addressLine1: "", addressLine2: "",
    city: "", state: "", postalCode: "", countryCode: "IN",
  };
}

function validateInlineAddress(f: InlineAddressForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.phone.trim()) e.phone = "Phone number is required.";
  if (!f.addressLine1.trim()) e.addressLine1 = "Address is required.";
  if (!f.city.trim()) e.city = "City is required.";
  if (!f.state.trim()) e.state = "State is required.";
  if (!f.postalCode.trim()) e.postalCode = "Postal code is required.";
  return e;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface CheckoutClientProps {
  currency: string;
  locale: string;
  storeName: string;
  razorpayEnabled: boolean;
  codEnabled: boolean;
  freeShippingThreshold?: number;
  flatDeliveryFee: number;
  codExtraFee: number;
}

type PaymentMethod = "Razorpay" | "CashOnDelivery";

/**
 * Step machine:
 *  idle        → user is filling the form
 *  placing     → POST /checkout in-flight
 *  rzp_loading → loading Razorpay SDK
 *  rzp_open    → Razorpay widget is open
 *  verifying   → POST /payments/verify in-flight
 *  dismissed   → user closed widget; show Retry / Cancel choices
 *  cancelling  → POST /orders/{id}/cancel in-flight
 *  success     → order confirmed
 *  failed      → unrecoverable error
 */
type CheckoutStep =
  | "idle"
  | "placing"
  | "rzp_loading"
  | "rzp_open"
  | "verifying"
  | "dismissed"
  | "cancelling"
  | "success"
  | "failed";

export function CheckoutClient({
  currency,
  locale,
  storeName,
  razorpayEnabled,
  codEnabled,
  freeShippingThreshold,
  flatDeliveryFee,
  codExtraFee,
}: CheckoutClientProps) {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { cart, isLoading: cartLoading, refresh: refreshCart } = useCart();
  const router = useRouter();

  // ── Saved addresses ─────────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<CustomerAddressResponse[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Inline form — only rendered when addresses.length === 0
  const [inlineForm, setInlineForm] = useState<InlineAddressForm>(emptyInlineAddress());
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});

  // Modal for adding additional addresses when user already has saved ones
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // ── Payment ─────────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    razorpayEnabled ? "Razorpay" : "CashOnDelivery",
  );

  // ── Coupon ──────────────────────────────────────────────────────────────────
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponValidationResponse | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // ── Checkout flow ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<CheckoutStep>("idle");
  const [stepError, setStepError] = useState("");
  const idempotencyRef = useRef(generateIdempotencyKey());

  // We keep the confirmed checkout response after POST /checkout so we can
  // reopen Razorpay on retry without a new POST /checkout call.
  const [confirmedCheckout, setConfirmedCheckout] = useState<CheckoutResponse | null>(null);

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const effectiveCurrency = cart?.currency ?? currency;

  const estimatedShipping =
    freeShippingThreshold != null && subtotal >= freeShippingThreshold
      ? 0
      : flatDeliveryFee;
  const estimatedCod = paymentMethod === "CashOnDelivery" ? codExtraFee : 0;
  const couponDiscount = coupon?.isValid ? coupon.discountAmount : 0;

  // ── Load saved addresses ────────────────────────────────────────────────────
  const loadAddresses = useCallback(async () => {
    setAddressesLoading(true);
    const result = await addressesApi.list();
    if (result.ok) {
      setAddresses(result.data);
      const defaultAddr = result.data.find((a) => a.isDefault) ?? result.data[0];
      if (defaultAddr) setSelectedAddressId((prev) => prev ?? defaultAddr.id);
    }
    setAddressesLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) void loadAddresses();
  }, [isAuthenticated, loadAddresses]);

  // ── Add address via modal (when user already has saved addresses) ─────────
  const handleModalAddAddress = useCallback(async (data: CreateAddressRequest) => {
    setSavingAddress(true);
    const result = await addressesApi.create(data);
    if (result.ok) {
      setAddresses((prev) => [...prev, result.data]);
      setSelectedAddressId(result.data.id);
      setAddAddressOpen(false);
    }
    setSavingAddress(false);
  }, []);

  // ── Coupon ──────────────────────────────────────────────────────────────────
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

  // ── Open Razorpay (shared between first attempt and retry) ────────────────
  const openRazorpayWidget = useCallback(
    (checkout: CheckoutResponse, addr: CustomerAddressResponse | null) => {
      if (!checkout.providerOrderId || !checkout.razorpayKeyId) return;

      const prefillName =
        addr
          ? [addr.firstName, addr.lastName].filter(Boolean).join(" ") || undefined
          : user
            ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || undefined
            : undefined;

      // Format phone for Razorpay — needs country code prefix (+91 for India)
      // Falls back in order: selected address → inline form → user profile
      const rawPhone = addr?.phone || inlineForm.phone || user?.phoneNumber;
      const prefillContact = rawPhone
        ? rawPhone.startsWith("+")
          ? rawPhone                            // already has country code: +919876543210
          : `+91${rawPhone.replace(/^0+/, "")}` // prefix +91, strip leading zeros
        : undefined;

      openRazorpay({
        key: checkout.razorpayKeyId,
        amount: Math.round(checkout.grandTotal * 100), // paise — server total
        currency: checkout.currency ?? effectiveCurrency,
        name: storeName,
        description: `Order #${checkout.orderNumber ?? checkout.orderId}`,
        order_id: checkout.providerOrderId,
        prefill: {
          name: prefillName,
          email: user?.email,
          contact: prefillContact, // pre-fills the widget; user can still edit it
        },
        theme: { color: "#09090b" },
        handler: async (response) => {
          setStep("verifying");
          const verifyResult = await checkoutApi.verifyPayment(checkout.orderId, {
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });
          if (verifyResult.ok) {
            // Payment confirmed — clear persisted state
            pendingPaymentStore.clear();
            setStep("success");
            router.push(`/order-success/${checkout.orderId}`);
          } else {
            // Spec: do NOT let user retry silently — payment may already be captured.
            pendingPaymentStore.clear();
            setStepError(
              `Payment could not be verified. Please contact support with your order number: ${checkout.orderNumber ?? checkout.orderId}`,
            );
            setStep("failed");
          }
        },
        modal: {
          ondismiss: () => {
            // Order is in PendingPayment state. Show Retry / Cancel options.
            // Keep same idempotency key — backend returns the existing order on retry.
            setStep("dismissed");
          },
        },
      });
    },
    [user, storeName, effectiveCurrency, inlineForm.phone, router],
  );

  // ── Retry: reopen Razorpay with same providerOrderId (no new /checkout) ──
  const handleRetryPayment = useCallback(async () => {
    if (!confirmedCheckout) return;
    setStep("rzp_loading");
    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded) {
      setStepError("Payment SDK failed to load. Check your connection and try again.");
      setStep("failed");
      return;
    }
    setStep("rzp_open");
    const addr = addresses.find((a) => a.id === selectedAddressId) ?? null;
    openRazorpayWidget(confirmedCheckout, addr);
  }, [confirmedCheckout, addresses, selectedAddressId, openRazorpayWidget]);

  // ── Cancel: release the PendingPayment order ──────────────────────────────
  const handleCancelOrder = useCallback(async () => {
    if (!confirmedCheckout) return;
    setStep("cancelling");
    await ordersApi.cancel(confirmedCheckout.orderId, "Customer cancelled pending payment");
    pendingPaymentStore.clear();
    setConfirmedCheckout(null);
    // Generate a fresh idempotency key so user can start a new order
    idempotencyRef.current = generateIdempotencyKey();
    setStep("idle");
    setStepError("");
  }, [confirmedCheckout]);

  // ── Place order ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = useCallback(async () => {
    if (step !== "idle" && step !== "failed") return;
    setStepError("");

    // ── Resolve address ID ────────────────────────────────────────────────────
    let resolvedAddressId = selectedAddressId;
    let resolvedAddr: CustomerAddressResponse | null =
      addresses.find((a) => a.id === resolvedAddressId) ?? null;

    if (!resolvedAddressId) {
      // No saved addresses: validate and save inline form first
      const errs = validateInlineAddress(inlineForm);
      if (Object.keys(errs).length) {
        setInlineErrors(errs);
        return;
      }
      setInlineErrors({});
      setStep("placing");

      const saveResult = await addressesApi.create({
        firstName: inlineForm.firstName || undefined,
        lastName: inlineForm.lastName || undefined,
        phone: inlineForm.phone,
        addressLine1: inlineForm.addressLine1,
        addressLine2: inlineForm.addressLine2 || undefined,
        city: inlineForm.city,
        state: inlineForm.state,
        postalCode: inlineForm.postalCode,
        countryCode: inlineForm.countryCode,
        isDefault: true,
      });

      if (!saveResult.ok) {
        setStepError("Could not save your address. Please try again.");
        setStep("failed");
        return;
      }

      const savedAddr = saveResult.data;
      resolvedAddressId = savedAddr.id;
      resolvedAddr = savedAddr;
      setAddresses([savedAddr]);
      setSelectedAddressId(savedAddr.id);
    } else {
      setStep("placing");
    }

    // ── POST /checkout ────────────────────────────────────────────────────────
    const result = await checkoutApi.placeOrder({
      addressId: resolvedAddressId,
      paymentMethod,
      couponCode: coupon?.isValid ? coupon.couponCode ?? undefined : undefined,
      idempotencyKey: idempotencyRef.current,
    });

    if (!result.ok) {
      const err = result.error;
      const code = "code" in err ? (err as { code?: string }).code : undefined;
      const msg = extractApiError(err, "Could not place order. Please try again.");

      if (code === "CART_EMPTY") { router.push("/cart"); return; }

      if (err && "status" in err && (err as { status: number }).status === 409) {
        setStepError("This order was already placed. Redirecting to your orders…");
        setTimeout(() => router.push("/account/orders"), 2000);
        setStep("failed");
        return;
      }

      if (code === "COD_NOT_AVAILABLE") {
        setPaymentMethod("Razorpay");
        setStepError("Cash on Delivery is not available right now. Please pay online.");
        setStep("failed");
        return;
      }

      if (code === "PRODUCT_UNAVAILABLE") {
        setStepError(msg); setStep("failed"); await refreshCart(); return;
      }

      if (code === "INSUFFICIENT_INVENTORY" || code === "COUPON_INVALID" || code === "COUPON_USAGE_LIMIT") {
        setStepError(msg); setStep("failed");
        if (code === "INSUFFICIENT_INVENTORY") await refreshCart();
        return;
      }

      setStepError(msg); setStep("failed"); return;
    }

    const checkout = result.data;

    // ── COD ───────────────────────────────────────────────────────────────────
    if (paymentMethod === "CashOnDelivery") {
      setStep("success");
      router.push(`/order-success/${checkout.orderId}`);
      return;
    }

    // ── Razorpay: validate the response ───────────────────────────────────────
    // Spec: only proceed when orderStatus is "PendingPayment" AND both IDs are non-null.
    // If providerOrderId is null the backend Razorpay order creation failed.
    if (
      checkout.orderStatus !== "PendingPayment" ||
      !checkout.providerOrderId ||
      !checkout.razorpayKeyId
    ) {
      setStepError(
        "Payment initialisation failed. Please try again.",
      );
      setStep("failed");
      return;
    }

    // Persist to localStorage BEFORE opening the widget
    pendingPaymentStore.save({
      orderId: checkout.orderId,
      orderNumber: checkout.orderNumber,
      providerOrderId: checkout.providerOrderId,
      razorpayKeyId: checkout.razorpayKeyId,
      grandTotal: checkout.grandTotal,
      currency: checkout.currency ?? effectiveCurrency,
    });

    setConfirmedCheckout(checkout);

    setStep("rzp_loading");
    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded) {
      setStepError("Payment SDK failed to load. Check your connection and try again.");
      setStep("failed");
      return;
    }

    setStep("rzp_open");
    openRazorpayWidget(checkout, resolvedAddr);
  }, [
    step, selectedAddressId, inlineForm, paymentMethod, coupon,
    router, refreshCart, effectiveCurrency, addresses, openRazorpayWidget,
  ]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (authLoading || cartLoading) return <CheckoutSkeleton />;

  // ── Auth guard ───────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="container-x mx-auto py-16 max-w-lg text-center min-h-[60vh]">
        <p className="text-h4 font-semibold text-foreground">Sign in to checkout</p>
        <p className="mt-2 text-body-sm text-foreground-muted">
          You need an account to complete your purchase.
        </p>
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

  // ── Empty cart ───────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="container-x mx-auto py-16 max-w-lg text-center min-h-[60vh]">
        <ShoppingBag className="size-12 text-foreground-muted mx-auto mb-4" />
        <p className="text-h4 font-semibold text-foreground">Your cart is empty</p>
        <p className="mt-2 text-body-sm text-foreground-muted">
          Add some products before checking out.
        </p>
        <div className="mt-6">
          <Link href="/shop">
            <Button variant="primary" size="lg">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Derived UI state ─────────────────────────────────────────────────────────
  const isProcessing =
    step === "placing" || step === "rzp_loading" || step === "verifying" || step === "cancelling";

  const isResuming = step === "rzp_loading" || step === "rzp_open";
  const isCancelling = step === "cancelling";

  const canSubmit =
    !isProcessing &&
    step !== "rzp_open" &&
    step !== "dismissed" &&
    step !== "success" &&
    !addressesLoading;

  const stepLabel: Record<CheckoutStep, string> = {
    idle: "Place Order",
    placing: "Creating order…",
    rzp_loading: "Loading payment…",
    rzp_open: "Complete payment in popup",
    verifying: "Verifying payment…",
    dismissed: "Retry Payment",
    cancelling: "Cancelling order…",
    success: "Order placed!",
    failed: paymentMethod === "Razorpay" ? "Retry Payment" : "Retry Order",
  };

  const setInline = (field: keyof InlineAddressForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInlineForm((f) => ({ ...f, [field]: e.target.value }));
      setInlineErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    };

  return (
    <div className="container-x mx-auto py-8 md:py-12">
      <h1 className="text-h2 font-bold text-foreground mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">

        {/* ── LEFT ── */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* ── Delivery address ── */}
          <section aria-labelledby="addr-heading">
            <h2
              id="addr-heading"
              className="text-h4 font-semibold text-foreground mb-4 flex items-center gap-2"
            >
              <Truck className="size-4" aria-hidden="true" /> Delivery Address
            </h2>

            {addressesLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : addresses.length === 0 ? (
              /* ── No saved addresses: inline form ─── */
              <div className="rounded-xl border border-border p-5 flex flex-col gap-3">
                <p className="text-caption text-foreground-muted -mt-1 mb-1">
                  Enter your delivery address. It will be saved to your account.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="First Name" value={inlineForm.firstName} onChange={setInline("firstName")} autoComplete="given-name" />
                  <Input label="Last Name" value={inlineForm.lastName} onChange={setInline("lastName")} autoComplete="family-name" />
                </div>
                <Input label="Phone" type="tel" required value={inlineForm.phone} onChange={setInline("phone")} error={inlineErrors.phone} autoComplete="tel" />
                <Input label="Address Line 1" required value={inlineForm.addressLine1} onChange={setInline("addressLine1")} error={inlineErrors.addressLine1} autoComplete="address-line1" />
                <Input label="Address Line 2 (optional)" value={inlineForm.addressLine2} onChange={setInline("addressLine2")} autoComplete="address-line2" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="City" required value={inlineForm.city} onChange={setInline("city")} error={inlineErrors.city} autoComplete="address-level2" />
                  <Input label="State" required value={inlineForm.state} onChange={setInline("state")} error={inlineErrors.state} autoComplete="address-level1" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Postal Code" required value={inlineForm.postalCode} onChange={setInline("postalCode")} error={inlineErrors.postalCode} autoComplete="postal-code" />
                  <Input label="Country Code" required value={inlineForm.countryCode} onChange={setInline("countryCode")} placeholder="IN" autoComplete="country" />
                </div>
              </div>
            ) : (
              /* ── Has saved addresses: radio picker ── */
              <div className="flex flex-col gap-3">
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  role="radiogroup"
                  aria-label="Select delivery address"
                >
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      htmlFor={`addr-${addr.id}`}
                      className={cn(
                        "relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
                        selectedAddressId === addr.id
                          ? "border-foreground bg-muted/30"
                          : "border-border hover:border-border-strong",
                      )}
                    >
                      <input
                        id={`addr-${addr.id}`}
                        type="radio"
                        name="deliveryAddress"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-0.5 accent-foreground shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-foreground truncate">
                          {[addr.firstName, addr.lastName].filter(Boolean).join(" ") || addr.label || "Address"}
                          {addr.isDefault && (
                            <span className="ml-2 inline-flex items-center gap-0.5 text-caption text-foreground-muted">
                              <Star className="size-3 fill-foreground-muted" aria-hidden="true" />
                              Default
                            </span>
                          )}
                        </p>
                        <address className="not-italic text-caption text-foreground-muted mt-0.5 leading-relaxed">
                          {addr.addressLine1 && <span>{addr.addressLine1}, </span>}
                          {addr.city && <span>{addr.city}, </span>}
                          {addr.state && <span>{addr.state} </span>}
                          {addr.postalCode && <span>{addr.postalCode}</span>}
                          {addr.phone && <span className="block">{addr.phone}</span>}
                        </address>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setAddAddressOpen(true)}
                  className="flex items-center gap-2 text-body-sm text-foreground-muted hover:text-foreground transition-colors self-start mt-1"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add a new address
                </button>
              </div>
            )}
          </section>

          {/* ── Payment method ── */}
          {(razorpayEnabled || codEnabled) && (
            <section aria-labelledby="pay-heading">
              <h2
                id="pay-heading"
                className="text-h4 font-semibold text-foreground mb-4 flex items-center gap-2"
              >
                <CreditCard className="size-4" aria-hidden="true" /> Payment Method
              </h2>
              <div className="flex flex-col gap-3" role="radiogroup" aria-label="Select payment method">
                {razorpayEnabled && (
                  <PaymentOption
                    id="pm-razorpay"
                    value="Razorpay"
                    selected={paymentMethod === "Razorpay"}
                    onSelect={() => setPaymentMethod("Razorpay")}
                    icon={<CreditCard className="size-4" />}
                    label="Pay Online"
                    description="Cards, UPI, Net Banking, Wallets — powered by Razorpay"
                  />
                )}
                {codEnabled && (
                  <PaymentOption
                    id="pm-cod"
                    value="CashOnDelivery"
                    selected={paymentMethod === "CashOnDelivery"}
                    onSelect={() => setPaymentMethod("CashOnDelivery")}
                    icon={<Banknote className="size-4" />}
                    label="Cash on Delivery"
                    description={
                      codExtraFee > 0
                        ? `+${formatPrice(codExtraFee, effectiveCurrency, locale)} COD fee`
                        : "Pay when your order arrives"
                    }
                  />
                )}
              </div>
            </section>
          )}

          {/* ── Coupon ── */}
          <section aria-labelledby="coupon-heading">
            <h2
              id="coupon-heading"
              className="text-h4 font-semibold text-foreground mb-4 flex items-center gap-2"
            >
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
              Final total will be confirmed after placing your order.
            </p>

            {/* ── Step: error ── */}
            {stepError && (
              <div role="alert" className="flex items-start gap-2 text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-3 py-2">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{stepError}</span>
              </div>
            )}

            {/* ── Step: widget open ── */}
            {step === "rzp_open" && (
              <p className="text-body-sm text-foreground-muted text-center animate-pulse">
                Complete payment in the popup window…
              </p>
            )}

            {/* ── Step: dismissed — Retry / Cancel ── */}
            {step === "dismissed" && (
              <div className="flex flex-col gap-2">
                <p className="text-body-sm text-foreground-muted text-center">
                  Payment was not completed. Your order is reserved.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isResuming}
                  onClick={handleRetryPayment}
                  iconLeft={<RefreshCw className="size-4" />}
                >
                  Retry Payment
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  loading={isCancelling}
                  onClick={handleCancelOrder}
                  iconLeft={<XCircle className="size-4" />}
                >
                  Cancel Order
                </Button>
              </div>
            )}

            {/* ── Step: normal CTA ── */}
            {step !== "dismissed" && (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!canSubmit}
                loading={isProcessing}
                onClick={handlePlaceOrder}
                aria-live="polite"
              >
                {stepLabel[step]}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Add address modal (when user already has saved addresses) ── */}
      <Modal
        open={addAddressOpen}
        onClose={() => setAddAddressOpen(false)}
        title="Add Delivery Address"
        size="max-w-lg"
      >
        <AddressForm
          onSave={handleModalAddAddress}
          saving={savingAddress}
          onCancel={() => setAddAddressOpen(false)}
        />
      </Modal>
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
      <input id={id} type="radio" name="paymentMethod" value={value} checked={selected} onChange={onSelect} className="mt-0.5 accent-foreground" />
      <span className="mt-0.5 text-foreground-muted">{icon}</span>
      <div>
        <p className="text-body-sm font-medium text-foreground">{label}</p>
        <p className="text-caption text-foreground-muted">{description}</p>
      </div>
    </label>
  );
}

function SummaryRow({
  label, value, highlight, muted,
}: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={cn("text-foreground-muted", highlight && "text-success")}>{label}</span>
      <span className={cn("font-medium tabular-nums", highlight ? "text-success" : muted ? "text-foreground-muted" : "text-foreground")}>
        {value}
      </span>
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
