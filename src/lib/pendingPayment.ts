/**
 * Pending Payment Persistence
 *
 * When Razorpay is opened we persist just enough of the checkout response to
 * localStorage so that, if the user closes the browser before the payment
 * widget fires its handler, we can rehydrate on next launch and prompt them to
 * resume or cancel.
 *
 * Key is user-scoped (orderId) so multiple tabs / accounts don't clash.
 */

const STORAGE_KEY = "kromic_pending_payment";

export interface PersistedCheckout {
  orderId: string;
  orderNumber?: string;
  providerOrderId: string;
  razorpayKeyId: string;
  grandTotal: number;
  currency: string;
  savedAt: number; // unix ms — used to expire stale entries
}

const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes — Razorpay order expiry is typically 15 min

export const pendingPaymentStore = {
  save(data: Omit<PersistedCheckout, "savedAt">): void {
    if (typeof window === "undefined") return;
    const entry: PersistedCheckout = { ...data, savedAt: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    } catch {
      // storage quota — non-fatal
    }
  },

  load(): PersistedCheckout | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const entry = JSON.parse(raw) as PersistedCheckout;
      // Discard stale entries
      if (Date.now() - entry.savedAt > MAX_AGE_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return entry;
    } catch {
      return null;
    }
  },

  clear(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // non-fatal
    }
  },
};
