/**
 * Customer orders API
 */
import { apiClient } from "./client";
import type { OrderSummaryPagedResponse, OrderResponse } from "@/types/api";

export const ordersApi = {
  /** GET /api/v1/orders — paginated order history */
  list: (page = 1, pageSize = 10) =>
    apiClient.get<OrderSummaryPagedResponse>(
      `/api/v1/orders?page=${page}&pageSize=${pageSize}`,
    ),

  /** GET /api/v1/orders/{id} */
  get: (orderId: string) =>
    apiClient.get<OrderResponse>(`/api/v1/orders/${orderId}`),

  /** POST /api/v1/orders/{id}/cancel — now returns OrderResponse (was 204) */
  cancel: (orderId: string) =>
    apiClient.post<OrderResponse>(`/api/v1/orders/${orderId}/cancel`, {}),
};
