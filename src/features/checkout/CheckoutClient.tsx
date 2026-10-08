"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag, Tag, X, Truck, CreditCard, Banknote, CheckCircle,
  Plus, Star, AlertTriangle, RefreshCw, XCircle, Info, Phone, Loader2, CheckCircle2,
} from "lucide-react";
import { cn, formatPrice, extractApiError } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthContext";
import { useCart } from "@/features/cart/CartContext";
import { checkoutApi } from "@/services/api/checkout";
import { cartApi } from "@/services/api/cart";
import { ordersApi } from "@/services/api/orders";
import { addressesApi } from "@/services/api/addresses";
import { otpApi } from "@/services/api/otp";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { AddressForm } from "@/features/account/AddressForm";
import { VerificationDialog } from "@/features/otp/VerificationDialog";
import { loadRazorpayScript, openRazorpay } from "@/lib/razorpay";
import { pendingPaymentStore } from "@/lib/pendingPayment";
import { useIndianStates, matchStateName } from "@/hooks/useIndianStates";
import { usePinLookup } from "@/hooks/usePinLookup";
import type {
  CustomerAddressResponse,
  CreateAddressRequest,
  CheckoutResponse,
  CheckoutSummaryResponse,
  PhoneVerificationStatusResponse,
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
  district: string;
  state: string;
  postalCode: string;
  countryCode: string;
}

function emptyInlineAddress(): InlineAddressForm {
  return {
    firstName: "", lastName: "", phone: "",
    addressLine1: "", addressLine2: "",
    city: "", district: "", state: "", postalCode: "", countryCode: "IN",
  };
}

function validateInlineAddress(f: InlineAddressForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.phone.trim()) e.phone = "Phone number is required.";
  if (!f.addressLine1.trim()) e.addressLine1 = "Address is required.";
  if (!f.city.trim()) e.city = "City / Post Office is required.";
  if (!f.state.trim()) e.state = "State is required.";
  if (!f.postalCode.trim()) e.postalCode = "PIN code is required.";
  else if (f.postalCode.length !== 6) e.postalCode = "PIN code must be exactly 6 digits.";
  return e;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface CheckoutClientProps {
  currency: string;
  locale: string;
  storeName: string;
  /** Hint for initial Razorpay availability; authoritative from summary.paymentMethods[] */
  razorpayEnabled: boolean;
  /** Hint for initial COD availability; authoritative from summary.paymentMethods[] */
  codEnabled: boolean;
  /** When true, phone must be verified before order can be placed */
  mobileOtpEnabled: boolean;
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
  mobileOtpEnabled,
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

  // ── PIN + state hooks for the inline address form ─────────────────────────
  const { states: indiaStates, loading: statesLoading } = useIndianStates();
  const stateOptions: ComboboxOption[] = indiaStates.map((s) => ({ value: s.name_en, label: s.name_en }));

  const { status: inlinePinStatus, result: inlinePinResult, message: inlinePinMessage } =
    usePinLookup(inlineForm.postalCode);

  const [inlinePostOfficeOptions, setInlinePostOfficeOptions] = useState<ComboboxOption[]>([]);
  const [inlineDistrictOptions, setInlineDistrictOptions] = useState<ComboboxOption[]>([]);
  const [inlinePinPopulated, setInlinePinPopulated] = useState(false);

  useEffect(() => {
    if (inlinePinStatus === "success" && inlinePinResult) {
      const matchedState = matchStateName(inlinePinResult.state, indiaStates);
      const resolvedState = matchedState ? matchedState.name_en : inlinePinResult.state;
      const offices: ComboboxOption[] = inlinePinResult.postOffices.map((o) => ({ value: o.name, label: o.name }));
      setInlinePostOfficeOptions(offices);
      if (inlinePinResult.multipleDistricts) {
        const uniqueDistricts = [...new Set(inlinePinResult.postOffices.map((o) => o.district))];
        setInlineDistrictOptions(uniqueDistricts.map((d) => ({ value: d, label: d })));
      } else {
        setInlineDistrictOptions([]);
      }
      setInlineForm((f) => ({
        ...f,
        state: resolvedState,
        district: inlinePinResult.district,
        city: offices.length === 1 ? offices[0].value : f.city,
      }));
      setInlinePinPopulated(true);
      setInlineErrors((e) => { const n = { ...e }; delete n.state; delete n.postalCode; return n; });
    }
    if (inlinePinStatus === "idle" && inlinePinPopulated) {
      setInlinePostOfficeOptions([]);
      setInlineDistrictOptions([]);
      setInlinePinPopulated(false);
      setInlineForm((f) => ({ ...f, district: "", city: "" }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlinePinStatus, inlinePinResult, indiaStates]);

  // Modal for adding additional addresses when user already has saved ones
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // ── Payment ─────────────────────────────────────────────────────────────────
  // Default to Razorpay when available; fall back to COD if Razorpay is disabled;
  // COD is only shown when admin has configured it (codEnabled setting).
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    razorpayEnabled ? "Razorpay" : codEnabled ? "CashOnDelivery" : "Razorpay",
  );

  // ── Checkout Summary (§1.2) ──────────────────────────────────────────────────
  // This is the authoritative quote. grandTotal is what gets charged.
  const [summary, setSummary] = useState<CheckoutSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // ── Coupon ──────────────────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // ── Phone verification gate ───────────────────────────────────────────────
  // verifStatus: null = not yet fetched or OTP not required for this store.
  // We fetch lazily only when the user is authenticated.
  const [verifStatus, setVerifStatus] = useState<PhoneVerificationStatusResponse | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);

  // ── Checkout flow ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<CheckoutStep>("idle");
  const [stepError, setStepError] = useState("");
  const idempotencyRef = useRef(generateIdempotencyKey());

  // We keep the confirmed checkout response after POST /checkout so we can
  // reopen Razorpay on retry without a new POST /checkout call.
  const [confirmedCheckout, setConfirmedCheckout] = useState<CheckoutResponse | null>(null);

  const effectiveCurrency = cart?.currency ?? currency;

  // ── §1.2 Coupon active check — NEVER branch on appliedCouponCode alone ──────
  // Correct: couponErrorCode === null && appliedCouponCode !== null
  const couponActive =
    summary !== null &&
    summary.couponErrorCode === null &&
    summary.appliedCouponCode !== null;

  // ── Fetch checkout summary ──────────────────────────────────────────────────
  const fetchSummary = useCallback(
    async (method?: PaymentMethod) => {
      setSummaryLoading(true);
      setSummaryError("");
      const result = await checkoutApi.getSummary(
        method ? { paymentMethod: method } : undefined,
      );
      setSummaryLoading(false);
      if (result.ok) {
        setSummary(result.data);
        // If summary shows a coupon error, surface it to the coupon section
        if (result.data.couponErrorCode && result.data.couponErrorMessage) {
          setCouponError(result.data.couponErrorMessage);
        }
      } else {
        setSummaryError("Could not load order summary. Please refresh.");
      }
    },
    [],
  );

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
    if (isAuthenticated) {
      void loadAddresses();
      void fetchSummary(paymentMethod);
      // Only fetch verification status when OTP is enabled on this store
      if (mobileOtpEnabled) {
        void otpApi.getVerificationStatus().then((res) => {
          if (res.ok) setVerifStatus(res.data);
        });
      }
    }
    // fetchSummary intentionally not in deps — only runs on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loadAddresses, mobileOtpEnabled]);

  // ── Re-fetch summary when payment method changes ────────────────────────────
  // §3.3: codFee only appears in summary once CashOnDelivery is selected
  const handlePaymentMethodChange = useCallback(
    (method: PaymentMethod) => {
      setPaymentMethod(method);
      void fetchSummary(method);
    },
    [fetchSummary],
  );

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

  // ── §3.2 Coupon: apply ──────────────────────────────────────────────────────
  const handleApplyCoupon = useCallback(async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    const result = await cartApi.applyCoupon({ couponCode: couponInput.trim() });
    setCouponLoading(false);
    if (result.ok) {
      setSummary(result.data);
      // §1.2 coupon trap: branch on couponErrorCode === null
      if (result.data.couponErrorCode !== null) {
        // Coupon was rejected; appliedCouponCode is still set but discount is 0
        setCouponError(result.data.couponErrorMessage ?? "Coupon could not be applied.");
      } else {
        // Coupon accepted
        setCouponInput("");
        setCouponError("");
      }
    } else {
      // 400 — cart unchanged, coupon rejected at the HTTP level
      setCouponError(extractApiError(result.error, "Coupon could not be applied."));
    }
  }, [couponInput]);

  // ── §3.2 Coupon: remove ─────────────────────────────────────────────────────
  const handleRemoveCoupon = useCallback(async () => {
    setCouponLoading(true);
    setCouponError("");
    const result = await cartApi.removeCoupon();
    setCouponLoading(false);
    if (result.ok) {
      setSummary(result.data);
      setCouponInput("");
    }
    // Idempotent — safe even if no coupon was applied
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

  // ── §3.4 Cancel: release the PendingPayment order ────────────────────────
  const handleCancelOrder = useCallback(async () => {
    if (!confirmedCheckout) return;
    setStep("cancelling");
    const cancelResult = await ordersApi.cancel(confirmedCheckout.orderId, "Customer cancelled pending payment");

    // §1.11 / §3.4 — 409 REFUND_FAILED: order is genuinely still live
    if (!cancelResult.ok) {
      const err = cancelResult.error;
      const code = "code" in err ? (err as { code?: string }).code : undefined;
      if (code === "REFUND_FAILED") {
        setStepError(
          "code" in err && "message" in err
            ? String((err as { message?: string }).message)
            : "Refund failed. Your order is still active. Please contact support.",
        );
        setStep("dismissed"); // stay on the retry/cancel UI, order unchanged
        return;
      }
    }

    // 200 — refund accepted by provider (not yet settled; funds arrive in 5–7 days)
    pendingPaymentStore.clear();
    setConfirmedCheckout(null);
    // Generate a fresh idempotency key so user can start a new order
    idempotencyRef.current = generateIdempotencyKey();
    setStep("idle");
    setStepError("");
    // Re-fetch summary after cart is freed
    void fetchSummary(paymentMethod);
  }, [confirmedCheckout, fetchSummary, paymentMethod]);

  // ── Place order ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = useCallback(async () => {
    if (step !== "idle" && step !== "failed") return;
    setStepError("");

    // ── §3.1: Re-fetch summary immediately before POST /checkout ─────────────
    const latestSummaryResult = await checkoutApi.getSummary({ paymentMethod });
    if (!latestSummaryResult.ok) {
      setStepError("Could not verify order total. Please try again.");
      setStep("failed");
      return;
    }
    const latestSummary = latestSummaryResult.data;
    setSummary(latestSummary);

    // Check readiness
    if (!latestSummary.isReadyToCheckout) {
      const reason = latestSummary.blockingReasons[0]?.message ?? "Your cart cannot be checked out.";
      setStepError(reason);
      setStep("failed");
      return;
    }

    // ── Phone verification gate (frontend UX layer) ──────────────────────────
    // Only enforced when the store has mobileOtpEnabled.
    // The server independently enforces this; this is a UX-layer early return.
    if (mobileOtpEnabled) {
      const freshVerif = await otpApi.getVerificationStatus();
      if (freshVerif.ok) {
        setVerifStatus(freshVerif.data);
        if (!freshVerif.data.verificationSatisfied) {
          // Show blocking verification dialog — do not submit
          setVerifyOpen(true);
          return;
        }
      }
      // If getVerificationStatus fails (e.g. network): allow checkout attempt — server enforces.
    }

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
      // Only pass couponCode if summary shows it as validly applied
      couponCode: couponActive && summary?.appliedCouponCode ? summary.appliedCouponCode : undefined,
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
        handlePaymentMethodChange("Razorpay");
        setStepError("Cash on Delivery is not available right now. Please pay online.");
        setStep("failed");
        return;
      }

      // ── Phone verification required (backend enforcement) ──────────────────
      if (code === "PHONE_VERIFICATION_REQUIRED") {
        setStep("idle");
        setStepError("");
        // Re-fetch verification status, then open dialog
        const freshVerif = await otpApi.getVerificationStatus();
        if (freshVerif.ok) setVerifStatus(freshVerif.data);
        setVerifyOpen(true);
        return;
      }

      // ── Address phone mismatch — address phone ≠ verified account phone ────
      // Resolution: the user must update the address phone to match their verified number.
      // Do NOT let the user type an arbitrary override — that defeats the verification gate.
      if (code === "ADDRESS_PHONE_MISMATCH") {
        setStep("idle");
        setStepError(
          "Your delivery address phone number must match your verified mobile number. " +
          "Please update the address or verify a different number.",
        );
        return;
      }

      if (code?.startsWith("PRODUCT_UNAVAILABLE") || code?.startsWith("VARIANT_UNAVAILABLE") || code?.startsWith("INSUFFICIENT_STOCK")) {
        setStepError(msg); setStep("failed"); await refreshCart(); return;
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
    step, selectedAddressId, inlineForm, paymentMethod, couponActive, summary,
    router, refreshCart, effectiveCurrency, addresses, openRazorpayWidget,
    handlePaymentMethodChange, setVerifyOpen, mobileOtpEnabled,
  ]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (authLoading || cartLoading) return <CheckoutSkeleton />;

  // ── Auth guard ───────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="px-5 md:px-8 lg:px-10 py-16 max-w-lg text-center min-h-[60vh]">
        <p className="text-[18px] font-bold text-[#191c1e]">Sign in to checkout</p>
        <p className="mt-2 text-[13px] text-[#444748]">
          You need an account to complete your purchase.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link href="/auth/login?redirect=/checkout">
            <Button variant="primary" size="lg" className="rounded-full px-8">Sign In</Button>
          </Link>
          <Link href="/auth/register?redirect=/checkout">
            <Button variant="secondary" size="lg" className="rounded-full px-8">Create Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Empty cart (also handles blockingReasons CART_EMPTY — 200 with zeroed totals) ─
  const cartItems = cart?.items ?? [];
  if (cartItems.length === 0) {
    return (
      <div className="px-5 md:px-8 lg:px-10 py-16 max-w-lg text-center min-h-[60vh]">
        <div className="rounded-2xl bg-[#f3f4f6] border border-[#e1e2e4] p-6 w-fit mx-auto mb-4">
          <ShoppingBag className="size-10 text-[#5A6578]" aria-hidden="true" />
        </div>
        <p className="text-[18px] font-bold text-[#191c1e]">Your cart is empty</p>
        <p className="mt-2 text-[13px] text-[#444748] leading-relaxed">
          Add some products before checking out.
        </p>
        <div className="mt-6">
          <Link href="/shop">
            <Button variant="primary" size="lg" className="rounded-full px-8">Continue Shopping</Button>
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
    !addressesLoading &&
    (summary?.isReadyToCheckout ?? true); // allow attempt if summary not loaded yet

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

  // ── §3.3 Payment methods: render from summary.paymentMethods[] ──────────────
  const availablePaymentMethods = summary?.paymentMethods ?? [];
  const razorpayMethod = availablePaymentMethods.find((m) => m.method === "Razorpay");
  const codMethod = availablePaymentMethods.find((m) => m.method === "CashOnDelivery");
  // Fall back to props while summary is loading
  const showRazorpay = razorpayMethod ? razorpayMethod.isAvailable : razorpayEnabled;
  const showCod = codMethod ? codMethod.isAvailable : codEnabled;
  const codUnavailableReason = codMethod?.isAvailable === false ? codMethod.unavailableReason : null;

  return (
    <div className="px-5 md:px-8 lg:px-10 py-8 md:py-12">
      <h1 className="text-[28px] md:text-[36px] font-extrabold text-[#191c1e] tracking-tight mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">

        {/* ── LEFT ── */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* ── Delivery address ── */}
          <section aria-labelledby="addr-heading">
            <h2
              id="addr-heading"
              className="text-[16px] font-bold text-[#191c1e] mb-4 flex items-center gap-2"
            >
              <Truck className="size-4 text-[#444748]" aria-hidden="true" /> Delivery Address
            </h2>

            {addressesLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : addresses.length === 0 ? (
              /* ── No saved addresses: inline form ─── */
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 flex flex-col gap-3">
                <p className="text-[12px] text-[#5A6578] -mt-1 mb-1">
                  Enter your delivery address. It will be saved to your account.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="First Name" value={inlineForm.firstName} onChange={setInline("firstName")} autoComplete="given-name" />
                  <Input label="Last Name" value={inlineForm.lastName} onChange={setInline("lastName")} autoComplete="family-name" />
                </div>
                <Input label="Phone" type="tel" required value={inlineForm.phone} onChange={setInline("phone")} error={inlineErrors.phone} autoComplete="tel" />
                <Input label="Address Line 1" required value={inlineForm.addressLine1} onChange={setInline("addressLine1")} error={inlineErrors.addressLine1} autoComplete="address-line1" />
                <Input label="Address Line 2 (optional)" value={inlineForm.addressLine2} onChange={setInline("addressLine2")} autoComplete="address-line2" />

                {/* PIN code with live lookup */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="checkout-pincode" className="text-[13px] font-semibold text-foreground">
                    PIN Code <span className="text-danger" aria-hidden="true">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="checkout-pincode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={inlineForm.postalCode}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 6);
                        if (inlinePinPopulated && raw !== inlineForm.postalCode) {
                          setInlinePostOfficeOptions([]);
                          setInlineDistrictOptions([]);
                          setInlinePinPopulated(false);
                          setInlineForm((f) => ({ ...f, postalCode: raw, district: "", city: "" }));
                        } else {
                          setInlineForm((f) => ({ ...f, postalCode: raw }));
                        }
                        setInlineErrors((prev) => { const n = { ...prev }; delete n.postalCode; return n; });
                      }}
                      placeholder="6-digit PIN"
                      autoComplete="postal-code"
                      aria-invalid={!!inlineErrors.postalCode}
                      className={cn(
                        "w-full rounded-md border border-border bg-[#F4F5F7]",
                        "h-11 px-3 pr-10 text-[14px] text-foreground placeholder:text-[#5A6578]",
                        "transition-colors duration-150",
                        "focus:outline-none focus:bg-white focus:border-[#0D0D0D]/40 focus:ring-1 focus:ring-[#0D0D0D]/10",
                        inlineErrors.postalCode && "border-danger",
                      )}
                    />
                    {inlinePinStatus === "loading" && (
                      <Loader2 className="absolute right-3 size-4 text-foreground-muted animate-spin pointer-events-none" aria-hidden="true" />
                    )}
                  </div>
                  {inlinePinStatus === "loading" && (
                    <span className="flex items-center gap-1 text-[11px] text-foreground-muted">
                      <Loader2 className="size-3 animate-spin" aria-hidden="true" />Checking PIN…
                    </span>
                  )}
                  {inlinePinStatus === "success" && (
                    <span className="flex items-center gap-1 text-[11px] text-success font-medium">
                      <CheckCircle2 className="size-3" aria-hidden="true" />Location found
                    </span>
                  )}
                  {(inlinePinStatus === "invalid" || inlinePinStatus === "error") && inlinePinMessage && (
                    <span className="flex items-center gap-1 text-[11px] text-danger">
                      <AlertTriangle className="size-3" aria-hidden="true" />{inlinePinMessage}
                    </span>
                  )}
                  {inlineErrors.postalCode && (
                    <p className="text-[12px] text-danger" role="alert">{inlineErrors.postalCode}</p>
                  )}
                </div>

                {/* State — searchable combobox */}
                <Combobox
                  id="checkout-state"
                  label="State"
                  required
                  options={stateOptions}
                  value={inlineForm.state}
                  onChange={(v) => {
                    setInlineForm((f) => ({ ...f, state: v }));
                    setInlineErrors((p) => { const n = { ...p }; delete n.state; return n; });
                  }}
                  placeholder="Search state…"
                  loading={statesLoading}
                  error={inlineErrors.state}
                  hint={inlinePinStatus === "success" ? "Auto-filled from PIN — you can change this." : undefined}
                  autoComplete="address-level1"
                  clearable={false}
                />

                {/* District */}
                {inlineDistrictOptions.length > 1 ? (
                  <Combobox
                    id="checkout-district"
                    label="District"
                    options={inlineDistrictOptions}
                    value={inlineForm.district}
                    onChange={(v) => setInlineForm((f) => ({ ...f, district: v }))}
                    placeholder="Select district…"
                    hint="Multiple districts for this PIN — select yours."
                  />
                ) : (
                  <Input
                    label="District"
                    value={inlineForm.district}
                    onChange={setInline("district")}
                    placeholder="Auto-filled from PIN"
                    hint={inlinePinStatus === "success" ? "Auto-filled from PIN — you can change this." : undefined}
                  />
                )}

                {/* City / Post Office */}
                {inlinePostOfficeOptions.length > 1 ? (
                  <Combobox
                    id="checkout-city"
                    label="City / Post Office"
                    required
                    options={inlinePostOfficeOptions}
                    value={inlineForm.city}
                    onChange={(v) => {
                      setInlineForm((f) => ({ ...f, city: v }));
                      setInlineErrors((p) => { const n = { ...p }; delete n.city; return n; });
                    }}
                    placeholder="Select post office…"
                    error={inlineErrors.city}
                    hint="Multiple post offices found — select the closest one."
                  />
                ) : (
                  <Input
                    label="City / Post Office"
                    required
                    value={inlineForm.city}
                    onChange={setInline("city")}
                    error={inlineErrors.city}
                    placeholder="e.g. Bangalore GPO"
                    hint={inlinePostOfficeOptions.length === 1 ? "Auto-filled from PIN — you can change this." : undefined}
                    autoComplete="address-level2"
                  />
                )}

                <Input label="Country Code" required value={inlineForm.countryCode} onChange={setInline("countryCode")} error={inlineErrors.countryCode} placeholder="IN" autoComplete="country" />
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
                        "relative flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
                        selectedAddressId === addr.id
                          ? "border-[#0D0D0D] bg-[#f3f4f6]"
                          : "border-[#E5E7EB] bg-white hover:border-[#c4c7c7]",
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
                        <p className="text-[13px] font-bold text-[#191c1e] truncate">
                          {[addr.firstName, addr.lastName].filter(Boolean).join(" ") || addr.label || "Address"}
                          {addr.isDefault && (
                            <span className="ml-2 inline-flex items-center gap-0.5 text-[11px] text-[#5A6578]">
                              <Star className="size-3 fill-foreground-muted" aria-hidden="true" />
                              Default
                            </span>
                          )}
                        </p>
                        <address className="not-italic text-[12px] text-[#5A6578] mt-0.5 leading-relaxed">
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
          {(showRazorpay || showCod || codUnavailableReason) && (
            <section aria-labelledby="pay-heading">
              <h2
                id="pay-heading"
                className="text-[16px] font-bold text-[#191c1e] mb-4 flex items-center gap-2"
              >
                <CreditCard className="size-4 text-[#444748]" aria-hidden="true" /> Payment Method
              </h2>
              <div className="flex flex-col gap-3" role="radiogroup" aria-label="Select payment method">
                {/* §3.3: render from paymentMethods[]; fall back to props while loading */}
                {(razorpayMethod?.isAvailable ?? razorpayEnabled) && (
                  <PaymentOption
                    id="pm-razorpay"
                    value="Razorpay"
                    selected={paymentMethod === "Razorpay"}
                    onSelect={() => handlePaymentMethodChange("Razorpay")}
                    icon={<CreditCard className="size-4" />}
                    label="Pay Online"
                    description="Cards, UPI, Net Banking, Wallets — powered by Razorpay"
                  />
                )}
                {(codMethod?.isAvailable ?? codEnabled) && (
                  <PaymentOption
                    id="pm-cod"
                    value="CashOnDelivery"
                    selected={paymentMethod === "CashOnDelivery"}
                    onSelect={() => handlePaymentMethodChange("CashOnDelivery")}
                    icon={<Banknote className="size-4" />}
                    label="Cash on Delivery"
                    description={
                      // §3.3: only show codFee after method is selected (from summary)
                      paymentMethod === "CashOnDelivery" && summary && summary.codFee > 0
                        ? `+${formatPrice(summary.codFee, effectiveCurrency, locale)} COD fee`
                        : "Pay when your order arrives"
                    }
                  />
                )}
                {/* Unavailable COD reason */}
                {codUnavailableReason && (
                  <p className="text-caption text-foreground-muted flex items-center gap-1.5">
                    <Info className="size-3.5" aria-hidden="true" />
                    {codUnavailableReason}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* ── Coupon ── */}
          <section aria-labelledby="coupon-heading">
            <h2
              id="coupon-heading"
              className="text-[16px] font-bold text-[#191c1e] mb-4 flex items-center gap-2"
            >
              <Tag className="size-4 text-[#444748]" aria-hidden="true" /> Coupon / Promo
            </h2>
            {/* §3.2: couponActive = couponErrorCode === null && appliedCouponCode !== null */}
            {couponActive && summary?.appliedCouponCode ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-success/30 bg-success/5">
                <CheckCircle className="size-4 text-success shrink-0" />
                <div className="flex-1">
                  <p className="text-body-sm font-medium text-foreground">{summary.appliedCouponCode}</p>
                  <p className="text-caption text-success">
                    {formatPrice(summary.discountAmount, effectiveCurrency, locale)} discount applied
                  </p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  disabled={couponLoading}
                  aria-label="Remove coupon"
                  className="text-foreground-muted hover:text-foreground disabled:opacity-50"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value); setCouponError(""); }}
                    error={couponError}
                    aria-label="Coupon code"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  loading={couponLoading}
                  disabled={!couponInput.trim()}
                  className="shrink-0 self-start mt-0"
                >
                  Apply
                </Button>
              </div>
            )}
          </section>
        </div>

        {/* ── RIGHT: summary ── */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <h2 className="text-[16px] font-bold text-[#191c1e] tracking-tight">Order Summary</h2>

            {/* Line items from summary or cart */}
            <ul className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {(summary?.items ?? cartItems).map((item) => (
                <li key={"cartItemId" in item ? item.cartItemId : item.id} className="flex items-start gap-2 text-body-sm">
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-foreground">{item.productName}</span>
                    {"variantDescription" in item && item.variantDescription && (
                      <span className="block truncate text-[11px] text-foreground-muted">{item.variantDescription}</span>
                    )}
                  </div>
                  <span className="text-foreground-muted shrink-0">×{item.quantity}</span>
                  <span className="font-medium text-foreground shrink-0 tabular-nums">
                    {formatPrice(item.lineTotal, effectiveCurrency, locale)}
                  </span>
                </li>
              ))}
            </ul>

            {summaryLoading && (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-full" />
              </div>
            )}

            {summaryError && (
              <p className="text-caption text-warning">{summaryError}</p>
            )}

            {!summaryLoading && summary && (
              <div className="flex flex-col gap-2 text-[13px] border-t border-[#e1e2e4] pt-3">
                <SummaryRow label="Subtotal" value={formatPrice(summary.subtotal, effectiveCurrency, locale)} />
                <SummaryRow
                  label={summary.isFreeShipping ? "Shipping (Free)" : "Shipping"}
                  value={summary.isFreeShipping ? "FREE" : formatPrice(summary.shippingAmount, effectiveCurrency, locale)}
                  highlight={summary.isFreeShipping}
                />
                {/* §3.3: only show codFee after method is selected */}
                {paymentMethod === "CashOnDelivery" && summary.codFee > 0 && (
                  <SummaryRow label="COD Fee" value={formatPrice(summary.codFee, effectiveCurrency, locale)} />
                )}
                {/* §1.2: coupon active = couponErrorCode === null */}
                {couponActive && summary.discountAmount > 0 && (
                  <SummaryRow
                    label="Discount"
                    value={`−${formatPrice(summary.discountAmount, effectiveCurrency, locale)}`}
                    highlight
                  />
                )}
                {/* §1.2: tax row — never add to grandTotal */}
                {summary.taxAmount > 0 && (
                  <SummaryRow
                    label={summary.isPriceInclusive
                      ? `${summary.taxLabel} (incl.)`
                      : summary.taxLabel || "Tax"}
                    value={formatPrice(summary.taxAmount, effectiveCurrency, locale)}
                    muted={summary.isPriceInclusive}
                  />
                )}
                {/* Free shipping progress */}
                {!summary.isFreeShipping && summary.freeShippingThreshold && summary.remainingForFreeShipping > 0 && (
                  <p className="text-caption text-foreground-muted">
                    Add {formatPrice(summary.remainingForFreeShipping, effectiveCurrency, locale)} more for free shipping
                  </p>
                )}
              </div>
            )}

            {!summaryLoading && summary && (
              <div className="flex justify-between py-3 border-t border-[#e1e2e4]">
                <span className="text-[14px] font-bold text-[#191c1e]">Total</span>
                {/* §1.2: grandTotal is what gets charged — display directly */}
                <span className="text-[16px] font-extrabold text-[#0D0D0D] tabular-nums">
                  {formatPrice(summary.grandTotal, effectiveCurrency, locale)}
                </span>
              </div>
            )}

            {!summaryLoading && !summary && (
              <>
                <p className="text-caption text-foreground-muted">
                  Final total will be confirmed after placing your order.
                </p>
              </>
            )}

            {/* §1.2: blocking reasons — shown as informational when not ready */}
            {summary && !summary.isReadyToCheckout && summary.blockingReasons.length > 0 && (
              <div role="alert" className="flex flex-col gap-1.5 text-body-sm text-warning bg-warning/5 border border-warning/20 rounded-md px-3 py-2">
                {summary.blockingReasons.map((r) => (
                  <div key={r.code} className="flex items-start gap-2">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{r.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Delivery estimate ── */}
            {summary?.deliveryEstimate && (
              <p className="text-caption text-foreground-muted">
                🚚 {summary.deliveryEstimate.displayText}
              </p>
            )}

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

            {/* ── Phone verification gate banner ── */}
            {verifStatus && !verifStatus.verificationSatisfied && step !== "dismissed" && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-md bg-warning/5 border border-warning/20 px-3 py-3"
              >
                <Phone className="size-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-foreground">
                    Phone verification required
                  </p>
                  <p className="text-caption text-foreground-muted mt-0.5">
                    Verify your mobile number before placing this order.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setVerifyOpen(true)}>
                  Verify
                </Button>
              </div>
            )}

            {/* ── Step: normal CTA ── */}
            {step !== "dismissed" && (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!canSubmit || (verifStatus !== null && !verifStatus.verificationSatisfied)}
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

      {/* ── Phone verification dialog (blocking gate) ── */}
      <VerificationDialog
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onVerified={async (status) => {
          setVerifStatus(status);
          setVerifyOpen(false);
          // Re-enable the CTA immediately — verification satisfied
        }}
        initialPhone={user?.phoneNumber ?? ""}
        purpose="PhoneVerification"
        title="Verify your mobile number"
        subtitle="Phone verification is required before placing this order."
        blocking
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PaymentOption({ id, value, selected, onSelect, icon, label, description }: {
  id: string; value: string; selected: boolean;
  onSelect: () => void; icon: React.ReactNode;
  label: string; description: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
        selected ? "border-[#0D0D0D] bg-[#f3f4f6]" : "border-[#E5E7EB] bg-white hover:border-[#c4c7c7]",
      )}
    >
      <input id={id} type="radio" name="paymentMethod" value={value} checked={selected} onChange={onSelect} className="mt-0.5 accent-[#0D0D0D]" />
      <span className="mt-0.5 text-[#444748]">{icon}</span>
      <div>
        <p className="text-[13px] font-bold text-[#191c1e]">{label}</p>
        <p className="text-[12px] text-[#5A6578]">{description}</p>
      </div>
    </label>
  );
}

function SummaryRow({ label, value, highlight, muted }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={cn("text-[#5A6578]", highlight && "text-success")}>{label}</span>
      <span className={cn("font-semibold tabular-nums", highlight ? "text-success" : muted ? "text-[#5A6578]" : "text-[#191c1e]")}>
        {value}
      </span>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="px-5 md:px-8 lg:px-10 py-8 md:py-12" aria-hidden="true">
      <Skeleton className="h-9 w-36 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    </div>
  );
}
