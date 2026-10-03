/**
 * pendingCartItem — stores a single "add to cart" action that happened while
 * the user was unauthenticated. After login, CartContext picks it up and
 * replays the add so the item appears in the cart without user re-doing it.
 *
 * Only one item is stored (the last one clicked before login).
 */

const KEY = "kromic_pending_cart";

export interface PendingCartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export const pendingCartItem = {
  save(item: PendingCartItem) {
    try { sessionStorage.setItem(KEY, JSON.stringify(item)); } catch { /* ignore */ }
  },
  load(): PendingCartItem | null {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as PendingCartItem) : null;
    } catch { return null; }
  },
  clear() {
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  },
};
