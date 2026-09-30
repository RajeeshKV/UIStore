/**
 * Checkout & Payment API
 */
import { apiClient } from "./client";
import type {
  CheckoutRequest,
  CheckoutResponse,
  RazorpayCallbackRequest,
  CheckoutSummaryResponse,
  GetCheckoutSummaryParams,
  OrderResponse,
} from "@/types/api";

export const checkoutApi = {
  /**
   * §2.1 NEW — GET /api/v1/checkout/summary
   * Auth required. The authoritative quote — supersedes all client-side math.
   * Trigger on: checkout page mount, payment-method change, after any cart mutation.
   * Re-fetch immediately before POST /checkout.
   */
  getSummary: (params?: GetCheckoutSummaryParams) => {
    const qs = new URLSearchParams();
    if (params?.paymentMethod) qs.set("paymentMethod", params.paymentMethod);
    if (params?.couponCode) qs.set("couponCode", params.couponCode);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return apiClient.get<CheckoutSummaryResponse>(`/api/v1/checkout/summary${query}`);
  },

  /** POST /api/v1/checkout — creates order and returns payment info */
  placeOrder: (data: CheckoutRequest) =>
    apiClient.post<CheckoutResponse>("/api/v1/checkout", data),

  /** POST /api/v1/payments/verify?orderId={orderId} — orderId is a query param per contract */
  verifyPayment: (orderId: string, data: RazorpayCallbackRequest) =>
    apiClient.post<{ orderId: string; orderNumber?: string; status: string; paidAt?: string }>(
      `/api/v1/payments/verify?orderId=${encodeURIComponent(orderId)}`,
      data,
    ),

  /** GET /api/v1/orders/{id} — fetch confirmed order for success page */
  getOrder: (orderId: string) =>
    apiClient.get<OrderResponse>(`/api/v1/orders/${orderId}`),
};
