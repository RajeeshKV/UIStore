/**
 * Checkout & Payment API
 */
import { apiClient } from "./client";
import type {
  CheckoutRequest,
  CheckoutResponse,
  RazorpayCallbackRequest,
  CouponValidationResponse,
  ValidateCouponRequest,
  OrderResponse,
} from "@/types/api";

export const checkoutApi = {
  /** POST /api/v1/checkout — creates order and returns payment info */
  placeOrder: (data: CheckoutRequest) =>
    apiClient.post<CheckoutResponse>("/api/v1/checkout", data),

  /** POST /api/v1/payments/verify?orderId={orderId} — orderId is a query param per contract */
  verifyPayment: (orderId: string, data: RazorpayCallbackRequest) =>
    apiClient.post<{ orderId: string; orderNumber?: string; status: string; paidAt?: string }>(
      `/api/v1/payments/verify?orderId=${encodeURIComponent(orderId)}`,
      data,
    ),

  /** POST /api/v1/store/promotions/validate */
  validateCoupon: (data: ValidateCouponRequest) =>
    apiClient.post<CouponValidationResponse>(
      "/api/v1/store/promotions/validate",
      data,
      { skipAuth: true },
    ),

  /** GET /api/v1/orders/{id} — fetch confirmed order for success page */
  getOrder: (orderId: string) =>
    apiClient.get<OrderResponse>(`/api/v1/orders/${orderId}`),
};
