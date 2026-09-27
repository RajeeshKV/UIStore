/**
 * Customer profile API
 */
import { apiClient } from "./client";
import type {
  CustomerProfileResponse,
  UpdateCustomerProfileRequest,
} from "@/types/api";

export const customerApi = {
  getProfile: () =>
    apiClient.get<CustomerProfileResponse>("/api/v1/customer/profile"),

  updateProfile: (data: UpdateCustomerProfileRequest) =>
    apiClient.put<CustomerProfileResponse>("/api/v1/customer/profile", data),
};
