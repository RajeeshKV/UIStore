/**
 * Shopey – Shared API Types
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

/**
 * Public auth settings returned by GET /api/v1/store/settings.
 * Includes googleOAuthEnabled and googleClientId for the storefront.
 */
export interface PublicAuthSettingsDto {
  googleOAuthEnabled: boolean;
  /** Public Google OAuth Client ID — safe to expose to browser */
  googleClientId?: string;
  emailPasswordEnabled?: boolean;
  mobileOtpEnabled?: boolean;
}

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

/**
 * Payment settings returned in GET /api/v1/store/settings
 * Controls which payment methods are shown on checkout.
 */
export interface PaymentSettingsDto {
  razorpayEnabled: boolean;
  codEnabled: boolean;
  /** Public Razorpay Key ID — safe for browser. Use to init widget. */
  razorpayKeyId?: string;
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
  /** Auth settings — includes googleOAuthEnabled and googleClientId for storefront */
  auth?: PublicAuthSettingsDto;
  /** Payment settings — controls which methods are shown on checkout */
  payment?: PaymentSettingsDto;
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

// ── Variant Grid (GET /api/v1/store/products/variants) ────────────────────────

/**
 * Per-image record in a GridRow. Uses secureUrl (Cloudinary) not url.
 * The images array is the variant-level gallery. Fall back to primaryImageUrl
 * when this array is empty.
 */
export interface GridImage {
  id: string;
  secureUrl: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

/**
 * One row from GET /api/v1/store/products/variants.
 * - variantId is null for simple products (no variants).
 * - id is always set and is the row's own id (variant id for variant rows, product id for simple rows).
 * - effectivePrice is already resolved (priceOverride ?? product.price).
 * - canPurchase gates the add-to-cart button.
 */
export interface GridRow {
  id: string;
  variantId: string | null;
  productId: string;
  slug: string;
  name: string;
  sku: string | null;
  effectivePrice: number;
  currency: string;
  primaryImageUrl: string | null;
  stockAvailability: StockAvailability;
  canPurchase: boolean;
  isOutOfStock: boolean;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  brandId: string | null;
  brandName: string | null;
  brandSlug: string | null;
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  compareAtPrice?: number;
  images: GridImage[];
}

export interface GridRowPagedResponse {
  items: GridRow[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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
 * §1.6: Resolved variant attribute — added to both StorefrontVariantResponse and VariantResponse.
 * Use this for display; do NOT assume it matches attributeValueIds in length
 * (values deleted from an attribute are omitted here but may still appear in attributeValueIds).
 */
export interface VariantAttributeValueResponse {
  attributeValueId: string;
  attributeId: string;
  attributeName: string; // e.g. "Storage"
  value: string;         // e.g. "128GB"
}

/**
 * Actual StorefrontVariantResponse from the API.
 * Note: no 'name' field — variant identity is from attribute values.
 * 'effectivePrice' is the backend-calculated final price (not 'price').
 * 'attributeValueIds' is a comma-separated string of AttributeValue IDs.
 * §1.6 ADDED: attributes — resolved display names (optional, backward-compatible).
 * §1.7: inactive variants are excluded from purchase; canPurchase is now false for inactive variants regardless of stock.
 */
export interface StorefrontVariantResponse {
  id: string;
  sku?: string;
  effectivePrice: number;
  sortOrder: number;
  isActive: boolean;
  /** Comma-separated AttributeValue IDs (e.g. "uuid1,uuid2") — legacy echo, use attributes for display */
  attributeValueIds?: string;
  stockAvailability: StockAvailability;
  /** §1.7: now false for inactive variant regardless of stock */
  canPurchase: boolean;
  /** §1.6 NEW — resolved attribute values; use for display labels */
  attributes?: VariantAttributeValueResponse[];
  /**
   * Variant-scoped image gallery (guide 41 §4.6, §7).
   * When the user selects a variant, show these images in the PDP gallery.
   * Fall back to the product gallery when this array is empty.
   */
  images?: StorefrontImageResponse[];
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
  /** Average rating from published reviews (0 = no reviews yet, don't show stars) */
  ratingAverage?: number;
  /** Number of published reviews */
  ratingCount?: number;
  /** True when ratingCount > 0 — use this as the display gate */
  hasRatings?: boolean;
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
 * §1.1: couponCode is ADDED — normalised upper-case code in effect, or null.
 * CRITICAL: subtotal is pre-discount. The payable total is grandTotal from CheckoutSummaryResponse.
 */
export interface CartResponse {
  cartId: string;
  items?: CartItemResponse[];
  subtotal: number;
  currency?: string;
  totalItems: number;
  isEmpty: boolean;
  /** §1.1 NEW — normalised, upper-cased coupon code currently applied, or null */
  couponCode: string | null;
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
 * 'primaryImageUrl' added as of latest API update.
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
  primaryImageUrl?: string | null;
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

/**
 * §1.2 NEW — GET /api/v1/checkout/summary query parameters.
 * Omit paymentMethod while the customer is still choosing.
 * A blank/whitespace couponCode means "no override" — does NOT remove the cart coupon.
 */
export interface GetCheckoutSummaryParams {
  paymentMethod?: "Razorpay" | "CashOnDelivery";
  /** Overrides the cart coupon for this call only; blank = no override */
  couponCode?: string;
}

export type CheckoutSummaryPaymentMethod = "Razorpay" | "CashOnDelivery";
export type CheckoutSummaryDiscountType  = "Percentage" | "FixedAmount";
export type CheckoutSummaryStockAvailability = "InStock" | "LowStock" | "OutOfStock";

/**
 * §1.2 NEW — GET /api/v1/checkout/summary response.
 * This is the AUTHORITATIVE quote. grandTotal is what gets charged.
 * NEVER add taxAmount to grandTotal — it is already included regardless of isPriceInclusive.
 *
 * Coupon trap: appliedCouponCode !== null does NOT mean the coupon is active.
 * When a coupon is rejected, appliedCouponCode still carries the submitted code
 * while discountAmount === 0 and couponErrorCode is set.
 * Branch on: couponErrorCode === null && appliedCouponCode !== null
 */
export interface CheckoutSummaryResponse {
  // ── Lines ────────────────────────────────────────────────────────────────
  items: Array<{
    cartItemId: string;
    productId: string;
    variantId: string | null;
    productName: string;
    productSlug: string;
    variantDescription: string | null;
    sku: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    stockAvailability: CheckoutSummaryStockAvailability;
    canPurchase: boolean;
    primaryImageUrl: string | null;
  }>;

  // ── Payable breakdown ─────────────────────────────────────────────────────
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  taxLabel: string;           // e.g. "GST"
  isPriceInclusive: boolean;
  shippingAmount: number;
  codFee: number;             // always 0 when paymentMethod is omitted or COD is unavailable
  grandTotal: number;         // ← the amount that will be charged; display this directly
  currency: string;

  // ── Coupon ───────────────────────────────────────────────────────────────
  /**
   * ⚠️ HIGH RISK: appliedCouponCode can be non-null even when the coupon was rejected.
   * Always check couponErrorCode === null before treating coupon as applied.
   */
  appliedCouponCode: string | null;
  discountType: CheckoutSummaryDiscountType | null;
  eligibleSubtotal: number;
  couponErrorCode: string | null;
  couponErrorMessage: string | null;

  // ── Shipping / COD ───────────────────────────────────────────────────────
  isFreeShipping: boolean;
  freeShippingThreshold: number | null;
  remainingForFreeShipping: number;
  isCodAvailable: boolean;
  deliveryEstimate: {
    earliestDate: string;
    latestDate: string;
    displayText: string;
  } | null;

  // ── Payment methods ──────────────────────────────────────────────────────
  isRazorpayConfigured: boolean;
  paymentMethods: Array<{
    method: CheckoutSummaryPaymentMethod;
    isAvailable: boolean;
    unavailableReason: string | null;
  }>;

  // ── Readiness ────────────────────────────────────────────────────────────
  isReadyToCheckout: boolean;
  blockingReasons: Array<{ code: string; message: string }>;
}

/** §1.3 NEW — POST /api/v1/cart/coupon request body */
export interface ApplyCouponRequest {
  couponCode: string; // exactly as customer typed; normalised server-side
}

export interface CheckoutRequest {
  /** ID of a saved customer address from GET /api/v1/customer/addresses */
  addressId: string;
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

// ── Product Attributes (Admin) ───────────────────────────────────────────────

/**
 * §2.4 NEW — GET /api/v1/products/{productId}/attributes response.
 * A product with no attributes returns attributes: [] and behaves as single-variant.
 */
export interface ProductAttributeValueItem {
  id: string;
  value: string;
  sortOrder: number;
}

export interface ProductAttributeItem {
  id: string;
  name: string;  // e.g. "Storage"
  sortOrder: number;
  values: ProductAttributeValueItem[];
}

export interface ProductAttributesResponse {
  productId: string;
  attributes: ProductAttributeItem[];
}

/**
 * §2.5 NEW — PUT /api/v1/products/{productId}/attributes request.
 * Replaces ONE attribute and its value list — not the whole product.
 * Matched by name; existing attribute with same name is updated, otherwise created.
 * ⚠️ Send the COMPLETE value list; omitting a value deletes it.
 */
export interface UpsertProductAttributeRequest {
  name: string;
  values: Array<{ value: string; id?: string }>;
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

/**
 * Variant-level image record returned by the admin API.
 * Mirrors ProductImageDto but belongs to a specific variant.
 * secureUrl is on asset (same as product images in admin).
 */
export interface VariantImageDto {
  id: string;
  asset?: MediaAssetDto;
  sortOrder: number;
  isPrimary: boolean;
  /** variantId is always set for variant images */
  variantId: string;
}

/** Request body for PUT /api/v1/products/{productId}/variants/{variantId}/images/reorder */
export interface ReorderVariantImagesRequest {
  /** Full ordered list: same shape as product image reorder — items[].{imageId, sortOrder} */
  items: Array<{ imageId: string; sortOrder: number }>;
}

/** Admin variant — includes priceOverride and attributeValueIds */
export interface VariantResponse {
  id: string;
  sku?: string;
  /** null means inherit from product price */
  priceOverride?: number;
  sortOrder: number;
  isActive: boolean;
  /** Comma-separated AttributeValue IDs (response only) — use attributes for display */
  attributeValueIds?: string;
  availableStock?: number;
  /** §1.6 NEW — resolved attribute values; use for display labels */
  attributes?: VariantAttributeValueResponse[];
  /** Variant-level image gallery (A.1 NEW) */
  images?: VariantImageDto[];
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
  isActive?: boolean;
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
  whatsAppNumber?: string;
  linkedInUrl?: string;
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
  /** Public Google OAuth Client ID — safe to expose to browser */
  googleClientId?: string;
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
  /**
   * @deprecated Ignored by the backend — provider is set exclusively through
   * PUT /api/v1/admin/integrations/sms. Omit this field; do not send it.
   */
  smsProvider?: never;
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
  enabled: boolean;
  keyId: string;
  keySecret: string;
  webhookSecret: string;
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

/**
 * PUT /api/v1/admin/integrations/sms
 * Returns 200 with the updated IntegrationStatusResponse — NOT 204.
 * Use the returned object directly to update UI state; no follow-up GET needed.
 *
 * Staged setup: save with enabled:false to store partial credentials,
 * then enable once all required fields are present.
 * Enabling an incomplete config returns 400 VALIDATION_PROVIDERSETTINGS.
 */
export interface UpdateSmsConfigRequest {
  enabled: boolean;
  provider?: string;
  /** Provider-specific key/value pairs. Omit a key to keep the stored value; send a value to update it. */
  providerSettings?: Record<string, string>;
}

// ── OTP / Phone Verification ──────────────────────────────────────────────────

export type OtpPurpose = "PhoneVerification" | "Login" | "PasswordReset";

/** POST /api/v1/otp/send */
export interface OtpSendRequest {
  phoneNumber?: string;
  purpose: OtpPurpose;
}

/** Response from POST /api/v1/otp/send (200 OK) */
export interface OtpSendResponse {
  expiresAtUtc: string;
  resendAvailableAtUtc: string;
}

/** POST /api/v1/otp/verify — returns 204 No Content on success */
export interface OtpVerifyRequest {
  phoneNumber?: string;
  otp?: string;
  purpose: OtpPurpose;
}

/**
 * GET /api/v1/otp/verification-status (requires auth)
 * verificationSatisfied is the single gate flag for checkout.
 * Already true when verificationRequired is false.
 */
export interface PhoneVerificationStatusResponse {
  verificationRequired: boolean;
  /** Canonical E.164 number on the account, or null */
  phoneNumber?: string;
  verified: boolean;
  /**
   * A number submitted via PUT /me/profile that has not yet been verified.
   * Render this as "pending verification" — never treat phoneNumber alone as
   * proof the requested change took effect.
   */
  pendingPhoneNumber?: string | null;
  /** Gate on this — already true when verification is not required */
  verificationSatisfied: boolean;
  /** Render OTP input at this width (default 4) */
  otpLength: number;
  otpExpiryMinutes: number;
  resendCooldownSeconds: number;
}

// ── SMS Admin ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/integrations/sms/providers
 * Full field schema per provider — the UI renders fields from this, not from hardcoded lists.
 */
export interface SmsProviderSettingField {
  /** Wire key used in PUT /admin/integrations/sms providerSettings object */
  key: string;
  /** Human-readable label */
  label: string;
  /** Input type: Text | Secret | Textarea | Number | Select */
  type: "Text" | "Secret" | "Textarea" | "Number" | "Select";
  required: boolean;
  maxLength?: number | null;
  /** Help text shown under the field */
  description?: string | null;
  /** Input placeholder text */
  placeholder?: string | null;
  /** Populated when type === "Select" */
  allowedValues?: string[] | null;
}

export interface SmsProviderOptionResponse {
  name: string;
  description?: string;
  /** Wire keys that must be non-empty when enabled:true */
  requiredSettings: string[];
  /** All configurable settings for this provider — render the form from this */
  settings: SmsProviderSettingField[];
  /** Provider-specific guidance notes */
  notes?: string[];
}

/**
 * GET /api/v1/admin/integrations/sms response.
 * missingSettings may be absent or null when not applicable — always treat as optional.
 */
export interface SmsIntegrationStatusResponse {
  enabled: boolean;
  provider?: string | null;
  isConfigured: boolean;
  /** Keys that are required but not yet saved. May be absent/null — always default to []. */
  missingSettings?: string[] | null;
}

/** GET/POST/PUT /api/v1/admin/integrations/sms/templates */
export interface SmsTemplateResponse {
  id: string;
  provider?: string;
  name?: string;
  body?: string;
  externalTemplateId?: string;
  isActive: boolean;
  updatedAtUtc: string;
}

export interface CreateSmsTemplateRequest {
  provider?: string;
  name?: string;
  body?: string;
  externalTemplateId?: string;
  isActive: boolean;
}

export interface UpdateSmsTemplateRequest {
  name?: string;
  body?: string;
  externalTemplateId?: string;
  isActive: boolean;
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

// ── Storefront: Carousel ──────────────────────────────────────────────────────

/**
 * A single carousel slide as returned by GET /api/v1/store/carousel.
 * Maps directly from StorefrontCarouselSlideResponse in the backend.
 * CtaTarget is always "/shop" — fixed by the server, not configurable per-slide.
 */
export interface StorefrontCarouselSlideResponse {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  ctaText?: string | null;
  sortOrder: number;
  ctaTarget: string; // always "/shop" — server-enforced constant
}

// ── Admin: Carousel ───────────────────────────────────────────────────────────

/**
 * Full carousel slide as returned by admin endpoints.
 * Includes imagePublicId, isActive, and audit timestamps — not exposed on the storefront shape.
 */
export interface CarouselSlideResponse {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  imagePublicId?: string | null;
  imageUrl?: string | null;
  ctaText?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateCarouselSlideRequest {
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface UpdateCarouselSlideRequest {
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string | null;
  sortOrder: number;
  isActive: boolean;
}

// ── Wishlist ──────────────────────────────────────────────────────────────────

/** GET /api/v1/wishlist/status?productIds= */
export interface WishlistStatusResponse {
  /** Product IDs that are currently in the wishlist */
  productIds: string[];
}

/** Item returned in GET /api/v1/wishlist and POST /api/v1/wishlist */
export interface WishlistItemResponse {
  id: string;
  productId: string;
  productVariantId?: string | null;
  productName?: string;
  productSlug?: string;
  productImageUrl?: string | null;
  basePrice: number;
  variantPrice?: number | null;
  effectivePrice: number;
  currencyCode?: string;
  stockAvailability: StockAvailability;
  canPurchase: boolean;
  isProductActive: boolean;
  addedAtUtc: string;
}

/** POST /api/v1/wishlist response */
export interface AddWishlistItemResponse {
  item: WishlistItemResponse;
  /** true when the item was newly created; false when it was already present */
  created: boolean;
}

/** POST /api/v1/wishlist request */
export interface AddWishlistItemRequest {
  productId: string;
  productVariantId?: string | null;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export interface ReviewImageDto {
  id: string;
  publicId?: string;
  url: string;
  sortOrder: number;
}

/** Public review item (GET /api/v1/products/{productId}/reviews) */
export interface ReviewResponse {
  id: string;
  productId: string;
  productVariantId?: string | null;
  authorName?: string;
  rating: number;
  title?: string;
  body?: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  images?: ReviewImageDto[];
  publishedAtUtc?: string;
  createdAtUtc: string;
}

/** Breakdown of ratings */
export interface RatingBreakdown {
  byRating: Record<string, number>;
}

/** GET /api/v1/products/{productId}/reviews full response */
export interface ReviewListResponse {
  page: PagedResponse<ReviewResponse>;
  ratingAverage: number;
  ratingCount: number;
  breakdown: RatingBreakdown;
}

/** Customer's own review — returned from POST/PUT/GET mine */
export interface MyReviewResponse {
  id: string;
  productId: string;
  productVariantId?: string | null;
  rating: number;
  title?: string;
  body?: string;
  status?: string; // Pending | Published | Rejected
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  images?: ReviewImageDto[];
  createdAtUtc: string;
  updatedAtUtc: string;
}

/** POST /api/v1/products/{productId}/reviews request */
export interface CreateReviewRequest {
  productVariantId?: string | null;
  rating: number;
  title?: string;
  body?: string;
  images?: Array<{ publicId: string; url: string }>;
}

/** PUT /api/v1/reviews/{reviewId} request */
export interface UpdateReviewRequest {
  rating: number;
  title?: string;
  body?: string;
  images?: Array<{ publicId: string; url: string }>;
}

/** POST /api/v1/reviews/{reviewId}/helpful response */
export interface ReviewHelpfulResponse {
  reviewId: string;
  helpfulCount: number;
  voted: boolean;
}

/** POST /api/v1/reviews/images response */
export interface ReviewImageUploadResponse {
  publicId: string;
  url: string;
}

/** Admin review item — includes customer info */
export interface AdminReviewResponse {
  id: string;
  productId: string;
  productName?: string;
  productVariantId?: string | null;
  customerId: string;
  customerEmail?: string;
  authorName?: string;
  rating: number;
  title?: string;
  body?: string;
  status: string; // Pending | Published | Rejected
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  images?: ReviewImageDto[];
  rejectionReason?: string | null;
  publishedAtUtc?: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

/** PUT /api/v1/admin/reviews/{reviewId}/status request */
export interface UpdateReviewStatusRequest {
  status: "Published" | "Rejected" | "Pending";
  reason?: string;
}

// ── Support Desk ──────────────────────────────────────────────────────────────

export type TicketStatus   = "Open" | "Resolved" | "Closed";
export type TicketPriority = "Low" | "Normal" | "High" | "Urgent";
export type TicketActor    = "User" | "Admin" | "System";
export type AttachmentKind = "Image" | "Video";

/** Attachment — returned inside comments and from POST /tickets/media */
export interface TicketAttachment {
  id?: string;
  kind: AttachmentKind;
  publicId: string;
  secureUrl: string;
  format: string;
  contentType: string;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  sizeBytes?: number | null;
  altText?: string | null;
}

/** Recursive comment node — server provides depth and replies[] */
export interface TicketCommentResponse {
  id: string;
  parentCommentId?: string | null;
  authorId?: string;
  authorName?: string;
  isAdminAuthor: boolean;
  body: string;
  depth: number;
  isInternalNote: boolean;
  createdAtUtc: string;
  attachments: TicketAttachment[];
  replies: TicketCommentResponse[];
}

/** Single history row */
export interface TicketHistoryEntry {
  id: string;
  fromStatus?: TicketStatus | null;
  toStatus?: TicketStatus;
  actor: TicketActor;
  actorId?: string;
  actorName?: string;
  note?: string | null;
  occurredAtUtc: string;
}

/** Lightweight ticket — returned by list endpoints */
export interface TicketSummaryResponse {
  id: string;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  assignedAdminId?: string | null;
  relatedOrderId?: string | null;
  orderNumber?: string | null;
  commentCount: number;
  reopenCount: number;
  awaitingFirstResponse: boolean;
  createdAtUtc: string;
  lastActivityAtUtc: string;
  resolvedAtUtc?: string | null;
  closedAtUtc?: string | null;
  autoCloseAtUtc?: string | null;
}

/** Full ticket detail — the "ticket" wrapper in GET /tickets/{id} */
export interface TicketDetailResponse {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  assignedAdminId?: string | null;
  relatedOrderId?: string | null;
  orderNumber?: string | null;
  reopenCount: number;
  awaitingFirstResponse: boolean;
  createdAtUtc: string;
  lastActivityAtUtc: string;
  resolvedAtUtc?: string | null;
  closedAtUtc?: string | null;
  autoCloseAtUtc?: string | null;
  comments: TicketCommentResponse[];
  /** Customer-visible transitions only (use fullHistory for admin) */
  history: TicketHistoryEntry[];
}

/** Wrapper returned by GET /tickets/{id} and GET /admin/tickets/{id} */
export interface TicketDetailEnvelope {
  ticket: TicketDetailResponse;
  /** Admin-only; same as history for now */
  fullHistory?: TicketHistoryEntry[];
}

// ── Support — request bodies ──────────────────────────────────────────────

export interface CreateTicketRequest {
  subject: string;
  description: string;
  orderId?: string | null;
}

export interface PostTicketCommentRequest {
  body: string;
  parentCommentId?: string | null;
  attachments?: TicketAttachmentInput[];
}

/** Subset of TicketAttachment sent back when creating a comment */
export interface TicketAttachmentInput {
  kind: AttachmentKind;
  publicId: string;
  secureUrl: string;
  format: string;
  contentType: string;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  sizeBytes?: number | null;
  altText?: string | null;
}

export interface CloseTicketRequest  { note?: string | null }
export interface ReopenTicketRequest { reason?: string | null }
export interface ResolveTicketRequest { resolutionNote?: string | null }
export interface SetTicketPriorityRequest { priority: TicketPriority }

// ── Support settings ──────────────────────────────────────────────────────

export interface SupportSettingsResponse {
  autoCloseIdleHours: number;
  notifyAdminOnTicketCreated: boolean;
  notifyAdminOnTicketReopened: boolean;
  notifyCustomerOnTicketResolved: boolean;
  maxAttachmentsPerComment: number;
  adminNotificationConfigured: boolean;
  /** Masked address or literal "not configured" — never empty string */
  adminNotificationTarget: string;
}

export interface UpdateSupportSettingsRequest {
  autoCloseIdleHours?: number | null;
  notifyAdminOnTicketCreated?: boolean | null;
  notifyAdminOnTicketReopened?: boolean | null;
  notifyCustomerOnTicketResolved?: boolean | null;
  maxAttachmentsPerComment?: number | null;
}
