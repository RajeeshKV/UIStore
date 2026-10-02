/**
 * Wishlist API — all routes require a customer JWT.
 * Customer id is derived from the access token server-side; never send it in the body.
 */
import { apiClient } from "./client";
import type {
  PagedResponse,
  WishlistItemResponse,
  AddWishlistItemResponse,
  AddWishlistItemRequest,
  WishlistStatusResponse,
} from "@/types/api";

export const wishlistApi = {
  /**
   * GET /api/v1/wishlist?page=&pageSize=
   * Returns paginated wishlist items for the authenticated customer.
   */
  list: (page = 1, pageSize = 20) =>
    apiClient.get<PagedResponse<WishlistItemResponse>>(
      `/api/v1/wishlist?page=${page}&pageSize=${pageSize}`,
    ),

  /**
   * GET /api/v1/wishlist/status?productIds=id1&productIds=id2…
   * Returns subset of provided productIds that are in the wishlist.
   * Use to render filled/empty hearts across a product grid (up to 200 IDs).
   */
  getStatus: (productIds: string[]) => {
    if (productIds.length === 0)
      return Promise.resolve({ ok: true as const, data: { productIds: [] } as WishlistStatusResponse });
    const params = productIds.map((id) => `productIds=${encodeURIComponent(id)}`).join("&");
    return apiClient.get<WishlistStatusResponse>(`/api/v1/wishlist/status?${params}`);
  },

  /**
   * POST /api/v1/wishlist — idempotent.
   * Returns { item, created: true } on first save; { item, created: false } if already saved.
   */
  add: (data: AddWishlistItemRequest) =>
    apiClient.post<AddWishlistItemResponse>("/api/v1/wishlist", data),

  /**
   * DELETE /api/v1/wishlist/{productId}?productVariantId=
   * Keyed on productId + optional variantId (not the wishlist row id).
   */
  remove: (productId: string, productVariantId?: string) => {
    const query = productVariantId ? `?productVariantId=${encodeURIComponent(productVariantId)}` : "";
    return apiClient.delete<void>(`/api/v1/wishlist/${productId}${query}`);
  },

  /**
   * DELETE /api/v1/wishlist — clears the entire wishlist.
   */
  clear: () => apiClient.delete<void>("/api/v1/wishlist"),
};
