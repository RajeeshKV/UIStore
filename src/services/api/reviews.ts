/**
 * Reviews API
 * - Public: GET reviews for a product
 * - Customer: POST/GET/PUT/DELETE own reviews, helpful votes, image upload
 * - Admin: moderation queue (list, get, update status, delete)
 */
import { apiClient } from "./client";
import type {
  PagedResponse,
  ReviewListResponse,
  MyReviewResponse,
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewHelpfulResponse,
  ReviewImageUploadResponse,
  AdminReviewResponse,
  UpdateReviewStatusRequest,
} from "@/types/api";

// ── Public ────────────────────────────────────────────────────────────────────

export const reviewsApi = {
  /**
   * GET /api/v1/products/{productId}/reviews
   * Public. Returns published reviews + rating summary.
   * sort: "recent" (default) | "helpful" | "rating"
   */
  list: (
    productId: string,
    params: {
      page?: number;
      pageSize?: number;
      sort?: "recent" | "helpful" | "rating";
      rating?: number;
    } = {},
  ) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.sort) qs.set("sort", params.sort);
    if (params.rating) qs.set("rating", String(params.rating));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return apiClient.get<ReviewListResponse>(
      `/api/v1/products/${productId}/reviews${query}`,
    );
  },

  // ── Customer ───────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/products/{productId}/reviews
   * Creates a review in Pending status. isVerifiedPurchase is server-derived.
   */
  create: (productId: string, data: CreateReviewRequest) =>
    apiClient.post<MyReviewResponse>(
      `/api/v1/products/${productId}/reviews`,
      data,
    ),

  /**
   * GET /api/v1/reviews/mine?page=&pageSize=
   * Returns the authenticated customer's own reviews.
   */
  mine: (page = 1, pageSize = 20) =>
    apiClient.get<PagedResponse<MyReviewResponse>>(
      `/api/v1/reviews/mine?page=${page}&pageSize=${pageSize}`,
    ),

  /**
   * PUT /api/v1/reviews/{reviewId}
   * Edits content only. Does not re-enter moderation.
   */
  update: (reviewId: string, data: UpdateReviewRequest) =>
    apiClient.put<MyReviewResponse>(`/api/v1/reviews/${reviewId}`, data),

  /**
   * DELETE /api/v1/reviews/{reviewId}
   */
  delete: (reviewId: string) =>
    apiClient.delete<void>(`/api/v1/reviews/${reviewId}`),

  /**
   * POST /api/v1/reviews/{reviewId}/helpful
   * Toggles helpful vote. Calling again withdraws the vote.
   */
  toggleHelpful: (reviewId: string) =>
    apiClient.post<ReviewHelpfulResponse>(
      `/api/v1/reviews/${reviewId}/helpful`,
    ),

  /**
   * POST /api/v1/reviews/images
   * Upload one image (multipart/form-data, field "file").
   * Returns publicId + url to reference in create/update request.
   */
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiClient.postForm<ReviewImageUploadResponse>(
      "/api/v1/reviews/images",
      fd,
    );
  },
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminReviewsApi = {
  /**
   * GET /api/v1/admin/reviews
   * Paginated with filters: status, productId, rating, search
   */
  list: (
    params: {
      status?: string;
      productId?: string;
      rating?: number;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.productId) qs.set("productId", params.productId);
    if (params.rating) qs.set("rating", String(params.rating));
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return apiClient.get<PagedResponse<AdminReviewResponse>>(
      `/api/v1/admin/reviews${query}`,
    );
  },

  /** GET /api/v1/admin/reviews/{reviewId} */
  getById: (reviewId: string) =>
    apiClient.get<AdminReviewResponse>(`/api/v1/admin/reviews/${reviewId}`),

  /**
   * PUT /api/v1/admin/reviews/{reviewId}/status
   * status: "Published" | "Rejected" | "Pending"
   * Rejecting requires a reason.
   */
  updateStatus: (reviewId: string, data: UpdateReviewStatusRequest) =>
    apiClient.put<AdminReviewResponse>(
      `/api/v1/admin/reviews/${reviewId}/status`,
      data,
    ),

  /** DELETE /api/v1/admin/reviews/{reviewId} */
  delete: (reviewId: string) =>
    apiClient.delete<void>(`/api/v1/admin/reviews/${reviewId}`),
};
