/**
 * Razorpay browser SDK lazy loader.
 *
 * The Razorpay Key ID is obtained from the backend checkout response at runtime.
 * It is NEVER stored in environment variables on the frontend.
 * The Razorpay secret never reaches this file or the browser.
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

/** Load the Razorpay browser SDK on demand. Idempotent — safe to call multiple times. */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") { resolve(false); return; }
    if (window.Razorpay) { resolve(true); return; }

    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayPaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  /** Public key ID from backend checkout response */
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayPaymentResult) => void;
  modal?: { ondismiss?: () => void };
}

/** Open the Razorpay payment sheet. Resolves with payment result or null on dismiss/failure. */
export function openRazorpay(options: RazorpayOptions): void {
  if (!window.Razorpay) throw new Error("Razorpay SDK not loaded");
  const rz = new window.Razorpay(options);
  rz.open();
}
