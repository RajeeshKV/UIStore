/**
 * Customer Addresses API
 */
import { apiClient } from "./client";
import type {
  CustomerAddressResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
} from "@/types/api";

export const addressesApi = {
  list: () =>
    apiClient.get<CustomerAddressResponse[]>("/api/v1/customer/addresses"),

  create: (data: CreateAddressRequest) =>
    apiClient.post<CustomerAddressResponse>(
      "/api/v1/customer/addresses",
      data,
    ),

  update: (id: string, data: UpdateAddressRequest) =>
    apiClient.put<CustomerAddressResponse>(
      `/api/v1/customer/addresses/${id}`,
      data,
    ),

  setDefault: (id: string) =>
    apiClient.put<CustomerAddressResponse>(
      `/api/v1/customer/addresses/${id}/default`,
      {},
    ),

  delete: (id: string) =>
    apiClient.delete<void>(`/api/v1/customer/addresses/${id}`),
};
