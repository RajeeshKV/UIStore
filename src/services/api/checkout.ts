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

  /** POST /api/v1/payments/verify — verify Razorpay payment (backend does HMAC) */
  verifyPayment: (data: RazorpayCallbackRequest) =>
    apiClient.post<{ success: boolean; orderId: string }>(
      "/api/v1/payments/verify",
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
