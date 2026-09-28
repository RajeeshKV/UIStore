/**
 * Kromic Store – Shared API Types
 *
 * Mirrors the actual backend API schemas.
 * Last audited: Phase 9 — all fields verified against api-documentation.json.
 * Never extend with frontend-only fields.
 */

// ── Common ────────────────────────────────────────────────────────────────────

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
  tokenType?: string;
}

/**
 * POST /api/v1/auth/reset-password
 * All four fields are required by the backend contract.
 */
export interface ResetPasswordRequest {
  email?: string;
  token?: string;
  newPassword?: string;
  confirmPassword?: string;
}

/**
 * Admin login — identifier accepts either username or email.
 * Field name is 'identifier' per backend contract, NOT 'email'.
 */
export interface LoginRequest {
  identifier: string;
  password: string;
  deviceHint?: string;
}

/**
 * Google OAuth — POST /api/v1/auth/google
 * idToken: Google ID token from Google Sign-In (NOT the application JWT).
 */
export interface GoogleCallbackRequest {
  idToken: string;
  deviceHint?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface MeResponse {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phoneNumberVerified: boolean;
  role?: string;
  isActive: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
}

// ── Store settings ────────────────────────────────────────────────────────────

export interface SeoSettingsDto {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
}

export interface DeliverySettingsDto {
  flatFeeAmount: number;
  freeShippingThreshold?: number;
  codEnabled: boolean;
  codExtraFee: number;
  processingDays: number;
  minDeliveryDays: number;
  maxDeliveryDays: number;
}

export interface TrackingSettingsDto {
  /** Google Analytics Measurement ID (GA4) */
  googleAnalyticsMeasurementId?: string;
  /** Meta / Facebook Pixel ID */
  metaPixelId?: string;
}

export interface PublicBusinessSettingsResponse {
  businessName?: string;
  legalName?: string;
  websiteUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  logoUrl?: string;
  address?: string;
  countryCode?: string;
  currencyCode?: string;
  timeZoneId?: string;
  culture?: string;
  isStoreOpen: boolean;
  temporaryClosureMessage?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  whatsAppNumber?: string;
  linkedInUrl?: string;
  seo?: SeoSettingsDto;
  delivery?: DeliverySettingsDto;
  tracking?: TrackingSettingsDto;
}

// ── Storefront: Categories ────────────────────────────────────────────────────

export interface StorefrontCategoryResponse {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  sortOrder?: number;
  imageUrl?: string;
  productCount?: number;
}

// ── Storefront: Brands ────────────────────────────────────────────────────────

export interface StorefrontBrandResponse {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  websiteUrl?: string;
  logoUrl?: string;
  productCount?: number;
}

// ── Storefront: Products ──────────────────────────────────────────────────────

/**
 * StockAvailability is an integer enum in the API (0=InStock, 1=LowStock, 2=OutOfStock).
 * The backend serializer may return either the integer or the string name.
 * We accept both to be resilient.
 */
export type StockAvailability = "InStock" | "LowStock" | "OutOfStock" | 0 | 1 | 2;

/** Normalise StockAvailability to string regardless of how backend serializes it */
export function normalizeStock(s: StockAvailability): "InStock" | "LowStock" | "OutOfStock" {
  if (s === 0 || s === "InStock") return "InStock";
  if (s === 1 || s === "LowStock") return "LowStock";
  return "OutOfStock";
}

export interface StorefrontImageResponse {
  id: string;
  url?: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface AttributeValueDto {
  id: string;
  value?: string;
  sortOrder: number;
}

export interface ProductAttributeDto {
  id: string;
  name?: string;
  sortOrder?: number;
  values?: AttributeValueDto[];
}

/**
 * Actual StorefrontVariantResponse from the API.
 * Note: no 'name' field — variant identity is from attribute values.
 * 'effectivePrice' is the backend-calculated final price (not 'price').
 * 'attributeValueIds' is a comma-separated string of AttributeValue IDs.
 */
export interface StorefrontVariantResponse {
  id: string;
  sku?: string;
  effectivePrice: number;
  sortOrder: number;
  isActive: boolean;
  /** Comma-separated AttributeValue IDs (e.g. "uuid1,uuid2") */
  attributeValueIds?: string;
  stockAvailability: StockAvailability;
  canPurchase: boolean;
}

export interface DeliveryEstimateDto {
  /** Estimated delivery from date string (e.g. "2024-12-25") */
  from?: string;
  /** Estimated delivery to date string */
  to?: string;
  description?: string;
}

export interface StorefrontProductSummaryResponse {
  id: string;
  name?: string;
  slug?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  primaryImageUrl?: string;
  stockAvailability: StockAvailability;
  canPurchase: boolean;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  brandId?: string;
  brandName?: string;
  brandSlug?: string;
  isFeatured: boolean;
}

export interface StorefrontProductResponse extends StorefrontProductSummaryResponse {
  description?: string;
  images?: StorefrontImageResponse[];
  attributes?: ProductAttributeDto[];
  variants?: StorefrontVariantResponse[];
  deliveryEstimate?: DeliveryEstimateDto;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

// ── Cart ──────────────────────────────────────────────────────────────────────

/**
 * Actual CartItemResponse from the backend.
 * 'id' is the line-item UUID used for update/delete.
 * 'productSlug' is used for navigation.
 * 'variantDescription' is the human-readable variant label.
 * 'unitPrice' + 'lineTotal' are the pricing fields (not 'price'/'subtotal').
 * 'primaryImageUrl' is the image field (not 'imageUrl').
 */
export interface CartItemResponse {
  id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  variantId?: string;
  variantDescription?: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  currency?: string;
  stockAvailability: StockAvailability;
  canPurchase: boolean;
  primaryImageUrl?: string;
}

/**
 * Actual CartResponse from the backend.
 * 'cartId' is the cart identifier (used as X-Cart-Token).
 * 'totalItems' is the item count (not 'itemCount').
 * No 'cartToken' field — the 'cartId' (UUID) is sent as X-Cart-Token.
 */
export interface CartResponse {
  cartId: string;
  items?: CartItemResponse[];
  subtotal: number;
  currency?: string;
  totalItems: number;
  isEmpty: boolean;
}

export interface AddCartItemRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// ── Orders ────────────────────────────────────────────────────────────────────

/**
 * OrderItemResponse from the backend.
 * 'variantDescription' not 'variantName'.
 * 'lineTotal' not 'subtotal'.
 * No 'imageUrl' or 'slug' on order items.
 */
export interface OrderItemResponse {
  id: string;
  productId: string;
  variantId?: string;
  productName?: string;
  variantDescription?: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface ShippingAddressDto {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface UpdateAddressRequest {
  label?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
}

/** Lightweight order summary — returned by GET /api/v1/orders list */
export interface OrderSummaryResponse {
  id: string;
  orderNumber?: string;
  status?: string;
  paymentMethod?: string;
  grandTotal: number;
  currency?: string;
  itemCount: number;
  createdAtUtc: string;
}

export interface OrderSummaryPagedResponse {
  items: OrderSummaryResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OrderResponse extends OrderSummaryResponse {
  /** subtotal is present on full OrderResponse (not on summary) */
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  codFee?: number;
  shippingAddress?: ShippingAddressDto;
  items?: OrderItemResponse[];
  trackingNumber?: string;
  trackingProvider?: string;
  cancellationReason?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  updatedAtUtc?: string;
}

// ── Customer ──────────────────────────────────────────────────────────────────

export interface CustomerAddressResponse {
  id: string;
  label?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  isDefault: boolean;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface CreateAddressRequest {
  label?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  isDefault?: boolean;
}

export interface CustomerProfileResponse {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phoneNumber?: string;
  phoneNumberVerified: boolean;
  avatarUrl?: string;
  dateOfBirth?: string;
  newsletterConsent: boolean;
  preferredTimeZoneId?: string;
  lastLoginAt?: string;
  updatedAtUtc?: string;
}

export interface UpdateCustomerProfileRequest {
  displayName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  newsletterConsent?: boolean;
  preferredTimeZoneId?: string;
}

// ── Checkout ──────────────────────────────────────────────────────────────────

export interface CheckoutRequest {
  shippingAddress: ShippingAddressDto;
  /** Exact enum values per backend contract */
  paymentMethod: "Razorpay" | "CashOnDelivery";
  couponCode?: string;
  idempotencyKey?: string;
}

export interface CheckoutResponse {
  orderId: string;
  orderNumber?: string;
  orderStatus?: string;
  paymentMethod?: string;
  subtotal: number;
  shippingAmount: number;
  codFee: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  currency?: string;
  appliedCouponCode?: string;
  providerOrderId?: string;
  /** Public Razorpay Key ID — safe for browser, returned at runtime. Never in env. */
  razorpayKeyId?: string;
  createdAtUtc: string;
}

export interface RazorpayCallbackRequest {
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
}

export interface CouponValidationResponse {
  isValid: boolean;
  couponCode?: string;
  discountAmount: number;
  discountType?: string;
  eligibleSubtotal: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface ValidateCouponRequest {
  couponCode?: string;
}

// ── Policies ──────────────────────────────────────────────────────────────────

export interface StorePolicyResponse {
  id: string;
  /** Backend field is 'policyType' */
  policyType?: string;
  title?: string;
  content?: string;
  isPublished: boolean;
  updatedAtUtc: string;
}

// ── Admin Types ───────────────────────────────────────────────────────────────
// These are used only by the Admin Panel frontend (Phase 11+).
// They are defined here to keep the single types contract in one place.

export interface BootstrapAdminRequest {
  email?: string;
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  bootstrapSecret?: string;
}

/** Admin product list item */
export interface ProductSummaryResponse {
  id: string;
  name?: string;
  slug?: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  status?: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  isFeatured: boolean;
  primaryImageUrl?: string;
  isAvailable: boolean;
  updatedAtUtc: string;
}

export interface ProductSummaryPagedResponse {
  items: ProductSummaryResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface MediaAssetDto {
  /** Cloudinary public ID — do not display this to customers */
  publicId?: string;
  secureUrl?: string;
  format?: string;
  width?: number;
  height?: number;
  altText?: string;
}

export interface ProductImageDto {
  id: string;
  asset?: MediaAssetDto;
  sortOrder: number;
  isPrimary: boolean;
}

/** Admin variant — includes priceOverride and attributeValueIds */
export interface VariantResponse {
  id: string;
  sku?: string;
  /** null means inherit from product price */
  priceOverride?: number;
  sortOrder: number;
  isActive: boolean;
  /** Comma-separated AttributeValue IDs (response only) */
  attributeValueIds?: string;
  availableStock?: number;
}

/**
 * Create variant request — attributeValueIds is an array of UUIDs in the request body.
 * (The response still returns them as a comma-separated string for storefront compat.)
 */
export interface CreateVariantRequest {
  sku?: string;
  priceOverride?: number;
  sortOrder?: number;
  /** Array of AttributeValue UUIDs */
  attributeValueIds?: string[];
}

/** Update variant request — same as create but includes isActive */
export interface UpdateVariantRequest extends CreateVariantRequest {
  isActive?: boolean;
}

/** Full admin product detail */
export interface ProductResponse {
  id: string;
  name?: string;
  slug?: string;
  sku?: string;
  description?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  status?: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  isFeatured: boolean;
  isTaxable: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  images?: ProductImageDto[];
  attributes?: ProductAttributeDto[];
  variants?: VariantResponse[];
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateProductRequest {
  name?: string;
  slug?: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  description?: string;
  shortDescription?: string;
  categoryId?: string;
  brandId?: string;
  isFeatured?: boolean;
  isTaxable?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export type UpdateProductRequest = CreateProductRequest;

/** Admin category */
export interface CategoryResponse {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl?: string;
  updatedAtUtc: string;
}

export interface CreateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  parentCategoryId?: string;
  sortOrder?: number;
}

export type UpdateCategoryRequest = CreateCategoryRequest;

/** Admin brand */
export interface BrandResponse {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  websiteUrl?: string;
  isActive: boolean;
  logoUrl?: string;
  updatedAtUtc: string;
}

export interface CreateBrandRequest {
  name?: string;
  slug?: string;
  description?: string;
  websiteUrl?: string;
}

export type UpdateBrandRequest = CreateBrandRequest;

/** Inventory */
export interface InventoryResponse {
  id: string;
  productId: string;
  variantId?: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  updatedAt: string;
}

export interface SetStockRequest {
  onHand: number;
  lowStockThreshold?: number;
}

export interface AdjustStockRequest {
  delta: number;
  reason?: string;
}

/** Promotions */
export interface PromotionSummaryResponse {
  id: string;
  name?: string;
  couponCode?: string;
  discountType?: string;
  discountValue: number;
  maxDiscountAmount?: number;
  isActive: boolean;
  usageCount: number;
  usageLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  applicability?: string;
  createdAtUtc: string;
}

export interface PromotionDetailResponse extends PromotionSummaryResponse {
  description?: string;
  maxDiscountAmount?: number;
  minimumOrderAmount?: number;
  perCustomerUsageLimit?: number;
  applicability?: string;
  isFirstOrderOnly: boolean;
  targetProductIds?: string[];
  targetCategoryIds?: string[];
  updatedAtUtc: string;
}

export interface CreatePromotionRequest {
  name?: string;
  description?: string;
  couponCode?: string;
  discountType?: string;
  discountValue: number;
  maxDiscountAmount?: number;
  minimumOrderAmount?: number;
  usageLimit?: number;
  perCustomerUsageLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  applicability?: string;
  isFirstOrderOnly?: boolean;
  targetProductIds?: string[];
  targetCategoryIds?: string[];
}

export type UpdatePromotionRequest = CreatePromotionRequest;

/** Tax */
export interface TaxConfigResponse {
  taxEnabled: boolean;
  taxPercentage: number;
  isPriceInclusive: boolean;
  taxLabel?: string;
}

export interface UpdateTaxConfigRequest {
  taxEnabled: boolean;
  taxPercentage: number;
  isPriceInclusive: boolean;
  taxLabel?: string;
}

/** Admin Settings */
export interface AdminBusinessSettingsResponse {
  businessName?: string;
  legalName?: string;
  websiteUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
  logoUrl?: string;
  countryCode?: string;
  currencyCode?: string;
  timeZoneId?: string;
  culture?: string;
  isStoreOpen: boolean;
  temporaryClosureMessage?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  updatedAtUtc: string;
  delivery?: DeliverySettingsDto;
  auth?: StoreAuthSettingsDto;
  /** Email display settings (mode, senderName, senderEmail) */
  email?: EmailSettingsDto;
  seo?: SeoSettingsDto;
}

export interface StoreAuthSettingsDto {
  googleOAuthEnabled: boolean;
  emailPasswordEnabled: boolean;
  mobileOtpEnabled: boolean;
  otpExpiryMinutes: number;
  otpResendCooldownSeconds: number;
  otpMaxAttempts: number;
  smsProvider?: string;
}

export interface UpdateBasicInfoRequest {
  businessName?: string;
  legalName?: string;
  websiteUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  whatsAppNumber?: string;
  linkedInUrl?: string;
}

export interface UpdateDeliverySettingsRequest {
  flatFeeAmount: number;
  freeShippingThreshold?: number;
  codEnabled: boolean;
  codExtraFee: number;
  processingDays: number;
  minDeliveryDays: number;
  maxDeliveryDays: number;
}

export interface UpdateSeoSettingsRequest {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
}

export interface SetStoreOpenRequest {
  isOpen: boolean;
  /** Field name in API is 'closureMessage' */
  closureMessage?: string;
}

export interface UpdateLocaleRequest {
  currencyCode?: string;
  countryCode?: string;
  timeZoneId?: string;
  culture?: string;
}

export interface UpdateAuthSettingsRequest {
  googleOAuthEnabled?: boolean;
  emailPasswordEnabled?: boolean;
  mobileOtpEnabled?: boolean;
  otpExpiryMinutes?: number;
  otpResendCooldownSeconds?: number;
  otpMaxAttempts?: number;
  smsProvider?: string;
}

/** Policies (admin) */
export interface UpsertStorePolicyRequest {
  /** Exact enum: TermsConditions | PrivacyPolicy | RefundPolicy | CancellationPolicy | ReturnPolicy | ShippingPolicy | OrderPolicy */
  policyType?: string;
  title?: string;
  content?: string;
  isPublished: boolean;
}

/** Admin order status update — status is a strict enum per backend contract */
export interface UpdateOrderStatusRequest {
  /** Exact enum: PendingPayment | PaymentProcessing | Confirmed | Processing | Packed | Shipped | Delivered | Cancelled | Failed | RefundPending | Refunded */
  status?: string;
  trackingNumber?: string;
  trackingProvider?: string;
  reason?: string;
}

/**
 * Integration status — returned by GET /api/v1/admin/integrations/*
 * maskedKeyId shows only the last 4 chars of the key.
 * hasSecret confirms a secret is stored without revealing it.
 * Secrets are NEVER returned in full.
 */
export interface IntegrationStatusResponse {
  integrationName?: string;
  enabled: boolean;
  isConfigured: boolean;
  maskedKeyId?: string;
  hasSecret: boolean;
  publicFields?: Record<string, string>;
}

export interface UpdateRazorpayConfigRequest {
  enabled?: boolean;
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
}

export interface UpdateGoogleOAuthConfigRequest {
  enabled?: boolean;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

/**
 * PUT /api/v1/admin/integrations/email — Integration-level email config.
 * Contract fields: enabled, mode, senderName, senderEmail, apiKey.
 */
export interface UpdateEmailConfigRequest {
  enabled?: boolean;
  mode?: string;
  senderName?: string;
  senderEmail?: string;
  apiKey?: string;
}

/**
 * PUT /api/v1/admin/settings/email — Email settings (display config, not integration secrets).
 * Note: this is different from UpdateEmailConfigRequest (integration).
 */
export interface UpdateEmailSettingsRequest {
  mode?: string;
  senderName?: string;
  senderEmail?: string;
}

export interface UpdateSmsConfigRequest {
  provider?: string;
  apiKey?: string;
  senderId?: string;
  enabled?: boolean;
}

/**
 * EmailSettingsDto — nested in AdminBusinessSettingsResponse.email
 * Contract fields: mode, senderName, senderEmail (no enabled/provider/fromEmail).
 */
export interface EmailSettingsDto {
  mode?: string;
  senderName?: string;
  senderEmail?: string;
}

/** Image reorder */
export interface ImageSortOrderItem {
  imageId: string;
  sortOrder: number;
}

export interface ReorderImagesRequest {
  items: ImageSortOrderItem[];
}
