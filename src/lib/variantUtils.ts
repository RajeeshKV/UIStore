/**
 * Shared variant utilities — used by ProductVariantSelector (PDP),
 * VariantProductCard (grid), and any admin/storefront code that needs
 * to resolve variants or images.
 *
 * Rules:
 * - Never compute prices — use effectivePrice from the API.
 * - Never expose exact stock counts — use stockAvailability bands.
 * - findVariant / isValueAvailable are the single source of truth for
 *   variant resolution. Do not duplicate in individual components.
 */

import type {
  StorefrontVariantResponse,
  StorefrontImageResponse,
  VariantImageDto,
} from "@/types/api";

// ── CSV parsing ───────────────────────────────────────────────────────────────

/**
 * Parse a comma-separated attributeValueIds string into a trimmed, non-empty
 * string array. Handles null / undefined / empty string safely.
 */
export function parseAttributeValueIds(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Variant resolution ────────────────────────────────────────────────────────

/**
 * Find the variant whose attribute-value set exactly matches the current
 * selection (order-independent set equality).
 *
 * @param variants  The full variants array from the PDP response.
 * @param selection Record of { axisId → valueId } for every selected axis.
 * @returns         The matching variant, or undefined when the selection is
 *                  partial or no combination exists.
 */
export function findVariant<
  T extends { id: string; attributeValueIds?: string | null },
>(
  variants: T[],
  selection: Record<string, string>,
): T | undefined {
  const wanted = Object.values(selection).sort();
  if (wanted.length === 0) return undefined;

  return variants.find((v) => {
    if (!v) return false;
    const ids = parseAttributeValueIds(v.attributeValueIds).sort();
    return (
      ids.length === wanted.length &&
      ids.every((id, i) => id === wanted[i])
    );
  });
}

/**
 * Returns true when `valueId` is still reachable given the rest of the current
 * selection. A value is available when at least one purchasable variant:
 *   1. Contains `valueId`, AND
 *   2. For every OTHER axis already selected, also contains that selection.
 *
 * Call this for every (axis, value) pair on every selection change to keep
 * swatch enabled/disabled states accurate.
 *
 * @param variants  Full variants array.
 * @param selection Current selection (axisId → valueId). May be partial.
 * @param axisId    The attribute axis the candidate value belongs to.
 * @param valueId   The candidate value to test.
 */
export function isValueAvailable(
  variants: Array<{
    attributeValueIds?: string | null;
    canPurchase: boolean;
  }>,
  selection: Record<string, string>,
  axisId: string,
  valueId: string,
): boolean {
  return variants.some((v) => {
    if (!v) return false;
    const ids = parseAttributeValueIds(v.attributeValueIds);
    if (!ids.includes(valueId) || !v.canPurchase) return false;
    // All OTHER currently-selected axes must agree
    return Object.entries(selection)
      .filter(([sid]) => sid !== axisId)
      .every(([, id]) => ids.includes(id));
  });
}

// ── Image resolution ──────────────────────────────────────────────────────────

/**
 * Resolve the best display image URL for a PDP or grid card.
 *
 * Fallback chain (guide 41 §3.2 / §7.3):
 *   1. Variant primary image (variant-level images array)
 *   2. Variant first image  (variant-level images array)
 *   3. Product primary image (product-level, VariantId = null)
 *   4. Product first image   (product-level)
 *   5. /placeholder.png
 *
 * Accepts StorefrontImageResponse (url) or VariantImageDto (asset.secureUrl)
 * as both are used in different contexts.
 */
function getImageUrl(
  img: StorefrontImageResponse | VariantImageDto,
): string {
  // StorefrontImageResponse uses .url; VariantImageDto uses .asset.secureUrl
  if ("url" in img && img.url) return img.url;
  if ("asset" in img && img.asset?.secureUrl) return img.asset.secureUrl;
  return "";
}

export function resolveProductImage(
  variantImages: Array<StorefrontImageResponse | VariantImageDto>,
  productImages: Array<StorefrontImageResponse>,
  primaryImageUrl?: string | null,
): string {
  // 1. Variant primary
  const variantPrimary = variantImages.find((i) => i.isPrimary);
  if (variantPrimary) {
    const url = getImageUrl(variantPrimary);
    if (url) return url;
  }

  // 2. Variant first
  if (variantImages.length > 0) {
    const url = getImageUrl(variantImages[0]);
    if (url) return url;
  }

  // 3. Product primary (no variantId, or just primary flag)
  const productPrimary = productImages.find(
    (i) =>
      i.isPrimary &&
      (!("variantId" in i) || (i as { variantId?: string | null }).variantId == null),
  );
  if (productPrimary?.url) return productPrimary.url;

  // 4. Product first
  if (productImages.length > 0 && productImages[0].url) {
    return productImages[0].url;
  }

  // 5. Pre-resolved URL (e.g. GridRow.primaryImageUrl)
  if (primaryImageUrl) return primaryImageUrl;

  return "/placeholder.png";
}

/**
 * Simpler resolver for grid cards — accepts the GridRow shape directly.
 * secureUrl variant: GridImage uses secureUrl (not url).
 */
export function resolveGridImage(
  variantImages: Array<{ secureUrl: string; isPrimary: boolean }>,
  primaryImageUrl: string | null | undefined,
): string {
  const primary = variantImages.find((i) => i.isPrimary);
  if (primary?.secureUrl) return primary.secureUrl;
  if (variantImages.length > 0 && variantImages[0].secureUrl)
    return variantImages[0].secureUrl;
  if (primaryImageUrl) return primaryImageUrl;
  return "/placeholder.png";
}

// ── Attribute label helpers ───────────────────────────────────────────────────

/**
 * Build a human-readable variant label from a resolved attributes array.
 * E.g. "Red · 128GB" (uses VariantAttributeValueResponse.value).
 * Falls back to SKU or a truncated ID when no attributes are present.
 */
export function variantLabel(variant: StorefrontVariantResponse): string {
  if (variant.attributes && variant.attributes.length > 0) {
    return variant.attributes.map((a) => a.value).join(" · ");
  }
  if (variant.sku) return variant.sku;
  return variant.id.slice(0, 8);
}
