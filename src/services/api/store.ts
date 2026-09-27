/**
 * Store / public settings API
 */
import { apiClient } from "./client";
import type {
  PublicBusinessSettingsResponse,
  StorefrontCategoryResponse,
  StorefrontBrandResponse,
  StorefrontProductSummaryResponse,
  StorefrontProductResponse,
  StorePolicyResponse,
  PagedResponse,
} from "@/types/api";

export const storeApi = {
  getSettings: () =>
    apiClient.get<PublicBusinessSettingsResponse>("/api/v1/store/settings", {
      skipAuth: true,
    }),

  getCategories: () =>
    apiClient.get<StorefrontCategoryResponse[]>("/api/v1/store/categories", {
      skipAuth: true,
    }),

  getCategoryBySlug: (slug: string) =>
    apiClient.get<StorefrontCategoryResponse>(
      `/api/v1/store/categories/${slug}`,
      { skipAuth: true },
    ),

  getBrands: () =>
    apiClient.get<StorefrontBrandResponse[]>("/api/v1/store/brands", {
      skipAuth: true,
    }),

  getBrandBySlug: (slug: string) =>
    apiClient.get<StorefrontBrandResponse>(`/api/v1/store/brands/${slug}`, {
      skipAuth: true,
    }),

  getFeatured: () =>
    apiClient.get<StorefrontProductSummaryResponse[]>("/api/v1/store/featured", {
      skipAuth: true,
    }),

  getPolicies: () =>
    apiClient.get<StorePolicyResponse[]>("/api/v1/store/policies", {
      skipAuth: true,
    }),

  getProducts: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return apiClient.get<PagedResponse<StorefrontProductSummaryResponse>>(
      `/api/v1/store/products${query}`,
      { skipAuth: true },
    );
  },

  getProductBySlug: (slug: string) =>
    apiClient.get<StorefrontProductResponse>(
      `/api/v1/store/products/${slug}`,
      { skipAuth: true },
    ),

  getRelatedProducts: (slug: string) =>
    apiClient.get<StorefrontProductSummaryResponse[]>(
      `/api/v1/store/products/${slug}/related`,
      { skipAuth: true },
    ),
};
