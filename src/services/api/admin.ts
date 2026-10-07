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
  VariantImageDto,
  ReorderVariantImagesRequest,
  ProductAttributesResponse,
  UpsertProductAttributeRequest,
  UpdateSmsConfigRequest,
  SmsProviderOptionResponse,
  SmsIntegrationStatusResponse,
  SmsTemplateResponse,
  CreateSmsTemplateRequest,
  UpdateSmsTemplateRequest,
  CarouselSlideResponse,
  CreateCarouselSlideRequest,
  UpdateCarouselSlideRequest,
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

  /**
   * POST /api/v1/products/{productId}/images
   * Contract: multipart/form-data with { file (binary), altText?, isPrimary? }
   * The backend does NOT accept a JSON URL — it requires a binary file upload.
   */
  /**
   * POST /api/v1/products/{productId}/images — batch upload 1–10 files (multipart/form-data)
   * Files sent as multiple `files` fields in a single FormData.
   */
  addImages: (productId: string, formData: FormData) =>
    apiClient.postForm<ProductImageDto[]>(`/api/v1/products/${productId}/images`, formData),

  /** PUT /api/v1/products/{productId}/images/{imageId}/set-primary */
  setPrimaryImage: (productId: string, imageId: string) =>
    apiClient.put<ProductImageDto>(`/api/v1/products/${productId}/images/${imageId}/set-primary`),

  deleteImage: (productId: string, imageId: string) =>
    apiClient.delete<void>(`/api/v1/products/${productId}/images/${imageId}`),

  /** PUT /api/v1/products/{productId}/images/reorder — returns ordered list */
  reorderImages: (productId: string, data: ReorderImagesRequest) =>
    apiClient.put<ProductImageDto[]>(`/api/v1/products/${productId}/images/reorder`, data),
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

// ── Variant Images ────────────────────────────────────────────────────────────

export const adminVariantImagesApi = {
  /**
   * POST /api/v1/products/{productId}/variants/{variantId}/images
   * Batch upload 1–10 files (multipart/form-data, field name "files").
   * Returns VariantImageDto[] — the first image becomes isPrimary automatically.
   * Errors: 400 TOO_MANY_FILES | INVALID_MIME_TYPE, 404 VARIANT_NOT_FOUND, 502 UPLOAD_FAILED.
   */
  upload: (productId: string, variantId: string, formData: FormData) =>
    apiClient.postForm<VariantImageDto[]>(
      `/api/v1/products/${productId}/variants/${variantId}/images`,
      formData,
    ),

  /**
   * PUT /api/v1/products/{productId}/variants/{variantId}/images/reorder
   * Send full ordered array of {imageId, sortOrder} (0-indexed).
   * Errors: 404 VARIANT_NOT_FOUND | IMAGE_NOT_FOUND.
   */
  reorder: (productId: string, variantId: string, data: ReorderVariantImagesRequest) =>
    apiClient.put<VariantImageDto[]>(
      `/api/v1/products/${productId}/variants/${variantId}/images/reorder`,
      data,
    ),

  /**
   * PUT /api/v1/products/{productId}/variants/{variantId}/images/{imageId}/set-primary
   * Promotes the given image to isPrimary and demotes all others for this variant.
   * Errors: 404 VARIANT_NOT_FOUND | IMAGE_NOT_FOUND.
   */
  setPrimary: (productId: string, variantId: string, imageId: string) =>
    apiClient.put<VariantImageDto>(
      `/api/v1/products/${productId}/variants/${variantId}/images/${imageId}/set-primary`,
    ),

  /**
   * DELETE /api/v1/products/{productId}/variants/{variantId}/images/{imageId}
   * If the deleted image was primary, the backend promotes the next by sortOrder.
   * Errors: 404 VARIANT_NOT_FOUND | IMAGE_NOT_FOUND.
   */
  delete: (productId: string, variantId: string, imageId: string) =>
    apiClient.delete<void>(
      `/api/v1/products/${productId}/variants/${variantId}/images/${imageId}`,
    ),
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

  /** PUT /api/v1/categories/{id}/image — upload/replace category image (multipart/form-data) */
  uploadImage: (id: string, formData: FormData) =>
    apiClient.putForm<CategoryResponse>(`/api/v1/categories/${id}/image`, formData),

  /** DELETE /api/v1/categories/{id}/image — remove category image */
  deleteImage: (id: string) =>
    apiClient.delete<void>(`/api/v1/categories/${id}/image`),
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

  /** PUT /api/v1/brands/{id}/logo — upload/replace brand logo (multipart/form-data) */
  uploadLogo: (id: string, formData: FormData) =>
    apiClient.putForm<BrandResponse>(`/api/v1/brands/${id}/logo`, formData),

  /** DELETE /api/v1/brands/{id}/logo — remove brand logo */
  deleteLogo: (id: string) =>
    apiClient.delete<void>(`/api/v1/brands/${id}/logo`),
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

  /** PUT /api/v1/admin/orders/{id}/status — returns OrderResponse (was 204) */
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

  /** PUT /api/v1/admin/policies — contract method is PUT, not POST */
  upsert: (data: UpsertStorePolicyRequest) =>
    apiClient.put<StorePolicyResponse>("/api/v1/admin/policies", data),

  delete: (id: string) =>
    apiClient.delete<void>(`/api/v1/admin/policies/${id}`),
};

// ── Integrations ──────────────────────────────────────────────────────────────

export const adminIntegrationsApi = {
  getPayment: () =>
    apiClient.get<IntegrationStatusResponse>("/api/v1/admin/integrations/payment"),

  updatePayment: (data: UpdateRazorpayConfigRequest) =>
    apiClient.put<IntegrationStatusResponse>("/api/v1/admin/integrations/payment", data),

  // NOTE: PUT /api/v1/admin/integrations/payment/cod has been REMOVED.
  // COD is managed exclusively via PUT /api/v1/admin/settings/delivery.

  getGoogle: () =>
    apiClient.get<IntegrationStatusResponse>("/api/v1/admin/integrations/google"),

  updateGoogle: (data: UpdateGoogleOAuthConfigRequest) =>
    apiClient.put<IntegrationStatusResponse>("/api/v1/admin/integrations/google", data),

  getEmail: () =>
    apiClient.get<IntegrationStatusResponse>("/api/v1/admin/integrations/email"),

  updateEmail: (data: UpdateEmailConfigRequest) =>
    apiClient.put<IntegrationStatusResponse>("/api/v1/admin/integrations/email", data),

  getSms: () =>
    apiClient.get<SmsIntegrationStatusResponse>("/api/v1/admin/integrations/sms"),

  /**
   * PUT /api/v1/admin/integrations/sms
   * Returns 200 with updated SmsIntegrationStatusResponse — no follow-up GET needed.
   * Blank secret values preserve the stored credential.
   */
  updateSms: (data: UpdateSmsConfigRequest) =>
    apiClient.put<SmsIntegrationStatusResponse>("/api/v1/admin/integrations/sms", data),
};

// ── Inventory ─────────────────────────────────────────────────────────────────
// NOTE: GET /api/v1/admin/inventory/{productId} does NOT exist in the backend contract.
// Only PUT (set stock) and POST /adjust exist.

export const adminInventoryApi = {
  /**
   * PUT /api/v1/admin/inventory/{productId}?variantId={variantId}
   * Sets absolute stock level.
   */
  set: (productId: string, data: SetStockRequest, variantId?: string) => {
    const query = variantId ? `?variantId=${variantId}` : "";
    return apiClient.put<InventoryResponse>(`/api/v1/admin/inventory/${productId}${query}`, data);
  },

  /**
   * POST /api/v1/admin/inventory/{productId}/adjust?variantId={variantId}
   * Adjusts stock by a delta amount.
   */
  adjust: (productId: string, data: AdjustStockRequest, variantId?: string) => {
    const query = variantId ? `?variantId=${variantId}` : "";
    return apiClient.post<InventoryResponse>(`/api/v1/admin/inventory/${productId}/adjust${query}`, data);
  },
};

// ── Product Attributes (Admin) ───────────────────────────────────────────────

export const adminAttributesApi = {
  /**
   * §2.4 NEW — GET /api/v1/products/{productId}/attributes
   * AdminOnly. Trigger on admin variant-editor mount.
   * Returns all attribute axes and their values for the product.
   */
  get: (productId: string) =>
    apiClient.get<ProductAttributesResponse>(`/api/v1/products/${productId}/attributes`),

  /**
   * §2.5 NEW — PUT /api/v1/products/{productId}/attributes
   * AdminOnly. Replaces ONE attribute (matched by name) and its full value list.
   * ⚠️ Always send the complete value list; omitting a value deletes it.
   * Include existing value id to edit/reorder; omit id to create new value.
   */
  upsert: (productId: string, data: UpsertProductAttributeRequest) =>
    apiClient.put<ProductAttributesResponse>(`/api/v1/products/${productId}/attributes`, data),

  /**
   * §2.6 NEW — DELETE /api/v1/products/{productId}/attributes/{attributeId}
   * AdminOnly. Deletes the attribute and all its values. Idempotent.
   */
  delete: (productId: string, attributeId: string) =>
    apiClient.delete<void>(`/api/v1/products/${productId}/attributes/${attributeId}`),
};

// ── SMS Admin (providers + templates) ────────────────────────────────────────

export const adminSmsApi = {
  /** GET /api/v1/admin/integrations/sms/providers — list of supported SMS providers */
  getProviders: () =>
    apiClient.get<SmsProviderOptionResponse[]>("/api/v1/admin/integrations/sms/providers"),

  /** GET /api/v1/admin/integrations/sms/templates */
  listTemplates: () =>
    apiClient.get<SmsTemplateResponse[]>("/api/v1/admin/integrations/sms/templates"),

  /** POST /api/v1/admin/integrations/sms/templates → 201 SmsTemplateResponse */
  createTemplate: (data: CreateSmsTemplateRequest) =>
    apiClient.post<SmsTemplateResponse>("/api/v1/admin/integrations/sms/templates", data),

  /** PUT /api/v1/admin/integrations/sms/templates/{id} → SmsTemplateResponse */
  updateTemplate: (id: string, data: UpdateSmsTemplateRequest) =>
    apiClient.put<SmsTemplateResponse>(`/api/v1/admin/integrations/sms/templates/${id}`, data),

  /** DELETE /api/v1/admin/integrations/sms/templates/{id} */
  deleteTemplate: (id: string) =>
    apiClient.delete<void>(`/api/v1/admin/integrations/sms/templates/${id}`),
};

// ── Carousel ──────────────────────────────────────────────────────────────────

export const adminCarouselApi = {
  /** GET /api/v1/admin/carousel?activeOnly=false */
  list: (activeOnly = false) =>
    apiClient.get<CarouselSlideResponse[]>(
      `/api/v1/admin/carousel?activeOnly=${activeOnly}`,
    ),

  /** GET /api/v1/admin/carousel/{id} */
  get: (id: string) =>
    apiClient.get<CarouselSlideResponse>(`/api/v1/admin/carousel/${id}`),

  /** POST /api/v1/admin/carousel */
  create: (data: CreateCarouselSlideRequest) =>
    apiClient.post<CarouselSlideResponse>("/api/v1/admin/carousel", data),

  /** PUT /api/v1/admin/carousel/{id} */
  update: (id: string, data: UpdateCarouselSlideRequest) =>
    apiClient.put<CarouselSlideResponse>(`/api/v1/admin/carousel/${id}`, data),

  /** DELETE /api/v1/admin/carousel/{id} */
  delete: (id: string) =>
    apiClient.delete<void>(`/api/v1/admin/carousel/${id}`),

  /** PUT /api/v1/admin/carousel/{id}/image — multipart/form-data with "file" field */
  uploadImage: (id: string, formData: FormData) =>
    apiClient.putForm<CarouselSlideResponse>(
      `/api/v1/admin/carousel/${id}/image`,
      formData,
    ),
};
