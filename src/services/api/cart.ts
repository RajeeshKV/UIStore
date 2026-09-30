/**
 * Cart API
 *
 * The backend identifies carts via X-Cart-Token header.
 * The value is the cartId (UUID) returned in CartResponse.
 * We persist this in localStorage as the cart session identifier.
 */
import { apiClient } from "./client";
import type {
  CartResponse,
  AddCartItemRequest,
  UpdateCartItemRequest,
  ApplyCouponRequest,
  CheckoutSummaryResponse,
} from "@/types/api";

const CART_ID_KEY = "kromic_cart_id";

export const cartTokenStore = {
  get: () =>
    typeof window !== "undefined"
      ? localStorage.getItem(CART_ID_KEY)
      : null,
  set: (cartId: string) => {
    if (typeof window !== "undefined")
      localStorage.setItem(CART_ID_KEY, cartId);
  },
  clear: () => {
    if (typeof window !== "undefined")
      localStorage.removeItem(CART_ID_KEY);
  },
};

function cartHeaders(): Record<string, string> {
  const cartId = cartTokenStore.get();
  return cartId ? { "X-Cart-Token": cartId } : {};
}

export const cartApi = {
  getCart: () =>
    apiClient.get<CartResponse>("/api/v1/cart", {
      headers: cartHeaders(),
    }),

  addItem: (data: AddCartItemRequest) =>
    apiClient.post<CartResponse>("/api/v1/cart/items", data, {
      headers: cartHeaders(),
    }),

  updateItem: (itemId: string, data: UpdateCartItemRequest) =>
    apiClient.put<CartResponse>(`/api/v1/cart/items/${itemId}`, data, {
      headers: cartHeaders(),
    }),

  removeItem: (itemId: string) =>
    apiClient.delete<CartResponse>(`/api/v1/cart/items/${itemId}`, {
      headers: cartHeaders(),
    }),

  clearCart: () =>
    apiClient.delete<CartResponse>("/api/v1/cart", {
      headers: cartHeaders(),
    }),

  /**
   * §2.2 NEW — POST /api/v1/cart/coupon
   * Auth required. Returns full CheckoutSummaryResponse (recalculated).
   * On rejection (400) the cart is left unchanged.
   */
  applyCoupon: (data: ApplyCouponRequest) =>
    apiClient.post<CheckoutSummaryResponse>("/api/v1/cart/coupon", data),

  /**
   * §2.3 NEW — DELETE /api/v1/cart/coupon
   * Auth required. Idempotent — safe to call with no coupon applied.
   * Returns full CheckoutSummaryResponse with no discount applied.
   */
  removeCoupon: () =>
    apiClient.delete<CheckoutSummaryResponse>("/api/v1/cart/coupon"),
};
