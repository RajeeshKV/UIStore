/**
 * Admin API services — all require Admin JWT.
 * Endpoints verified against api-documentation.json.
 */
import { apiClient } from "./client";
import type {
  PagedResponse,
  ProductSummaryResponse,
  ProductResponse,
  CreateProductRequest,
  UpdateProductRequest,
  VariantResponse,
  CreateVariantRequest,
  UpdateVariantRequest,
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  BrandResponse,
  CreateBrandRequest,
  UpdateBrandRequest,
  OrderResponse,
  OrderSummaryResponse,
  UpdateOrderStatusRequest,
  PromotionSummaryResponse,
  PromotionDetailResponse,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  TaxConfigResponse,
  UpdateTaxConfigRequest,
  AdminBusinessSettingsResponse,
  UpdateBasicInfoRequest,
  UpdateDeliverySettingsRequest,
  UpdateSeoSettingsRequest,
  UpdateLocaleRequest,
  UpdateAuthSettingsRequest,
  UpdateEmailSettingsRequest,
  SetStoreOpenRequest,
  StorePolicyResponse,
  UpsertStorePolicyRequest,
  IntegrationStatusResponse,
  UpdateRazorpayConfigRequest,
  UpdateGoogleOAuthConfigRequest,
  UpdateEmailConfigRequest,
  InventoryResponse,
  SetStockRequest,
  AdjustStockRequest,
  ProductImageDto,
  ReorderImagesRequest,
} from "@/types/api";

// ── Products ─────────────────────────────────────────────────────────────────

export const adminProductsApi = {
  /** Admin product list — GET /api/v1/products/admin (includes all statuses) */
  list: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return apiClient.get<PagedResponse<ProductSummaryResponse>>(
      `/api/v1/products/admin${query}`,
    );
  },

  /** Admin single product — GET /api/v1/products/admin/{id} */
  getById: (id: string) =>
    apiClient.get<ProductResponse>(`/api/v1/products/admin/${id}`),

  create: (data: CreateProductRequest) =>
    apiClient.post<ProductResponse>("/api/v1/products", data),

  update: (id: string, data: UpdateProductRequest) =>
    apiClient.put<ProductResponse>(`/api/v1/products/${id}`, data),

  publish: (id: string) =>
    apiClient.post<void>(`/api/v1/products/${id}/publish`),

  unpublish: (id: string) =>
    apiClient.post<void>(`/api/v1/products/${id}/unpublish`),

  archive: (id: string) =>
    apiClient.post<void>(`/api/v1/products/${id}/archive`),

  addImage: (productId: string, data: { url: string; altText?: string; isPrimary?: boolean }) =>
    apiClient.post<ProductImageDto>(`/api/v1/products/${productId}/images`, data),

  deleteImage: (productId: string, imageId: string) =>
    apiClient.delete<void>(`/api/v1/products/${productId}/images/${imageId}`),

  reorderImages: (productId: string, data: ReorderImagesRequest) =>
    apiClient.put<void>(`/api/v1/products/${productId}/images/reorder`, data),
};

// ── Variants ──────────────────────────────────────────────────────────────────

export const adminVariantsApi = {
  list: (productId: string) =>
    apiClient.get<VariantResponse[]>(`/api/v1/products/${productId}/variants`),

  getById: (productId: string, variantId: string) =>
    apiClient.get<VariantResponse>(`/api/v1/products/${productId}/variants/${variantId}`),

  create: (productId: string, data: CreateVariantRequest) =>
    apiClient.post<VariantResponse>(`/api/v1/products/${productId}/variants`, data),

  update: (productId: string, variantId: string, data: UpdateVariantRequest) =>
    apiClient.put<VariantResponse>(`/api/v1/products/${productId}/variants/${variantId}`, data),

  delete: (productId: string, variantId: string) =>
    apiClient.delete<void>(`/api/v1/products/${productId}/variants/${variantId}`),
};

// ── Categories ────────────────────────────────────────────────────────────────

export const adminCategoriesApi = {
  list: () =>
    apiClient.get<CategoryResponse[]>("/api/v1/categories"),

  getById: (id: string) =>
    apiClient.get<CategoryResponse>(`/api/v1/categories/${id}`),

  create: (data: CreateCategoryRequest) =>
    apiClient.post<CategoryResponse>("/api/v1/categories", data),

  update: (id: string, data: UpdateCategoryRequest) =>
    apiClient.put<CategoryResponse>(`/api/v1/categories/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/api/v1/categories/${id}`),
};

// ── Brands ────────────────────────────────────────────────────────────────────

export const adminBrandsApi = {
  list: () =>
    apiClient.get<BrandResponse[]>("/api/v1/brands"),

  getById: (id: string) =>
    apiClient.get<BrandResponse>(`/api/v1/brands/${id}`),

  create: (data: CreateBrandRequest) =>
    apiClient.post<BrandResponse>("/api/v1/brands", data),

  update: (id: string, data: UpdateBrandRequest) =>
    apiClient.put<BrandResponse>(`/api/v1/brands/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/api/v1/brands/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────

export const adminOrdersApi = {
  list: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return apiClient.get<{ items: OrderSummaryResponse[]; page: number; pageSize: number; totalCount: number; totalPages: number }>(
      `/api/v1/admin/orders${query}`,
    );
  },

  getById: (id: string) =>
    apiClient.get<OrderResponse>(`/api/v1/admin/orders/${id}`),

  updateStatus: (id: string, data: UpdateOrderStatusRequest) =>
    apiClient.put<OrderResponse>(`/api/v1/admin/orders/${id}/status`, data),
};

// ── Promotions ────────────────────────────────────────────────────────────────

export const adminPromotionsApi = {
  list: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return apiClient.get<{ items: PromotionSummaryResponse[]; page: number; pageSize: number; totalCount: number; totalPages: number }>(
      `/api/v1/admin/promotions${query}`,
    );
  },

  getById: (id: string) =>
    apiClient.get<PromotionDetailResponse>(`/api/v1/admin/promotions/${id}`),

  create: (data: CreatePromotionRequest) =>
    apiClient.post<PromotionDetailResponse>("/api/v1/admin/promotions", data),

  update: (id: string, data: UpdatePromotionRequest) =>
    apiClient.put<PromotionDetailResponse>(`/api/v1/admin/promotions/${id}`, data),

  activate: (id: string) =>
    apiClient.post<void>(`/api/v1/admin/promotions/${id}/activate`),

  deactivate: (id: string) =>
    apiClient.post<void>(`/api/v1/admin/promotions/${id}/deactivate`),

  delete: (id: string) =>
    apiClient.delete<void>(`/api/v1/admin/promotions/${id}`),
};

// ── Tax ───────────────────────────────────────────────────────────────────────

export const adminTaxApi = {
  get: () =>
    apiClient.get<TaxConfigResponse>("/api/v1/admin/tax"),

  update: (data: UpdateTaxConfigRequest) =>
    apiClient.put<TaxConfigResponse>("/api/v1/admin/tax", data),
};

// ── Settings ──────────────────────────────────────────────────────────────────

export const adminSettingsApi = {
  get: () =>
    apiClient.get<AdminBusinessSettingsResponse>("/api/v1/admin/settings"),

  updateBasic: (data: UpdateBasicInfoRequest) =>
    apiClient.put<AdminBusinessSettingsResponse>("/api/v1/admin/settings/basic", data),

  updateLocale: (data: UpdateLocaleRequest) =>
    apiClient.put<AdminBusinessSettingsResponse>("/api/v1/admin/settings/locale", data),

  updateDelivery: (data: UpdateDeliverySettingsRequest) =>
    apiClient.put<AdminBusinessSettingsResponse>("/api/v1/admin/settings/delivery", data),

  updateSeo: (data: UpdateSeoSettingsRequest) =>
    apiClient.put<AdminBusinessSettingsResponse>("/api/v1/admin/settings/seo", data),

  updateAuth: (data: UpdateAuthSettingsRequest) =>
    apiClient.put<AdminBusinessSettingsResponse>("/api/v1/admin/settings/auth", data),

  /** PUT /api/v1/admin/settings/email — email display settings (mode, senderName, senderEmail) */
  updateEmailSettings: (data: UpdateEmailSettingsRequest) =>
    apiClient.put<AdminBusinessSettingsResponse>("/api/v1/admin/settings/email", data),

  setStoreOpen: (data: SetStoreOpenRequest) =>
    apiClient.put<AdminBusinessSettingsResponse>("/api/v1/admin/settings/status", data),
};

// ── Policies ──────────────────────────────────────────────────────────────────

export const adminPoliciesApi = {
  list: () =>
    apiClient.get<StorePolicyResponse[]>("/api/v1/admin/policies"),

  upsert: (data: UpsertStorePolicyRequest) =>
    apiClient.post<StorePolicyResponse>("/api/v1/admin/policies", data),

  delete: (id: string) =>
    apiClient.delete<void>(`/api/v1/admin/policies/${id}`),
};

// ── Integrations ──────────────────────────────────────────────────────────────

export const adminIntegrationsApi = {
  getPayment: () =>
    apiClient.get<IntegrationStatusResponse>("/api/v1/admin/integrations/payment"),

  updatePayment: (data: UpdateRazorpayConfigRequest) =>
    apiClient.put<IntegrationStatusResponse>("/api/v1/admin/integrations/payment", data),

  getGoogle: () =>
    apiClient.get<IntegrationStatusResponse>("/api/v1/admin/integrations/google"),

  updateGoogle: (data: UpdateGoogleOAuthConfigRequest) =>
    apiClient.put<IntegrationStatusResponse>("/api/v1/admin/integrations/google", data),

  getEmail: () =>
    apiClient.get<IntegrationStatusResponse>("/api/v1/admin/integrations/email"),

  updateEmail: (data: UpdateEmailConfigRequest) =>
    apiClient.put<IntegrationStatusResponse>("/api/v1/admin/integrations/email", data),

  getSms: () =>
    apiClient.get<IntegrationStatusResponse>("/api/v1/admin/integrations/sms"),
};

// ── Inventory ─────────────────────────────────────────────────────────────────

export const adminInventoryApi = {
  get: (productId: string, variantId?: string) => {
    const query = variantId ? `?variantId=${variantId}` : "";
    return apiClient.get<InventoryResponse>(`/api/v1/admin/inventory/${productId}${query}`);
  },

  set: (productId: string, data: SetStockRequest, variantId?: string) => {
    const query = variantId ? `?variantId=${variantId}` : "";
    return apiClient.put<InventoryResponse>(`/api/v1/admin/inventory/${productId}${query}`, data);
  },

  adjust: (productId: string, data: AdjustStockRequest, variantId?: string) => {
    const query = variantId ? `?variantId=${variantId}` : "";
    return apiClient.post<InventoryResponse>(`/api/v1/admin/inventory/${productId}/adjust${query}`, data);
  },
};
