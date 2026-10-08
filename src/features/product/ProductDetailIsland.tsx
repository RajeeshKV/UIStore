"use client";

/**
 * ProductDetailIsland — client component that owns variant selection state
 * for the PDP. It renders both the gallery and the information panel so that
 * selecting a variant can immediately swap the hero image without a server
 * round-trip.
 *
 * Architecture (spec §3, §5):
 *   selectedVariant ──▶ galleryImages ──▶ ProductGallery (resets to idx 0)
 *   selectedVariant ──▶ ProductInformation (price, stock, CTA)
 *
 * Image isolation rules (R1, R6):
 *   - When variants exist: gallery ONLY ever shows variant-level images.
 *     product.images is NEVER passed to the gallery.
 *   - When a variant is resolved: show variant.images (empty → placeholder).
 *   - When no variant resolved: show empty array → gallery renders placeholder.
 *   - When product has NO variants: show product.images as the gallery.
 *
 * Incomplete-combination warning (guide 41 §4.7):
 *   Any variant whose attributeValueIds count < product.attributes.length is
 *   flagged. A banner is shown above the selector so the admin can fix it.
 */

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ProductGallery, ProductGalleryFallback } from "./ProductGallery";
import { ProductInformation } from "./ProductInformation";
import type {
  StorefrontProductResponse,
  StorefrontVariantResponse,
  StorefrontImageResponse,
} from "@/types/api";

interface ProductDetailIslandProps {
  product: StorefrontProductResponse;
  currency: string;
  locale: string;
  codEnabled?: boolean;
}

function parseIds(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

export function ProductDetailIsland({
  product,
  currency,
  locale,
  codEnabled = false,
}: ProductDetailIslandProps) {
  const safeVariants = (product.variants ?? []).filter(Boolean) as StorefrontVariantResponse[];
  const hasVariants = safeVariants.length > 0;

  /**
   * selectedVariant starts as null — no pre-selection.
   * R5: partial/no selection → price=product.price, "Select options", CTA disabled.
   * The selector drives this via onSelect (resolved) / onPartialSelect (clear).
   */
  const [selectedVariant, setSelectedVariant] =
    useState<StorefrontVariantResponse | null>(null);

  // ── Incomplete combination detection (guide 41 §4.7) ────────────────────
  const axisCount = product.attributes?.length ?? 0;
  const hasIncomplete =
    axisCount > 0 &&
    safeVariants.some((v) => parseIds(v.attributeValueIds).length < axisCount);

  // ── Gallery image source (R1, R2, R6) ────────────────────────────────────
  // When variants exist: use selectedVariant.images ONLY (may be empty → placeholder).
  // When no variants: use product.images.
  const galleryImages: StorefrontImageResponse[] = hasVariants
    ? (selectedVariant?.images ?? [])
    : (product.images ?? []);

  // Determine whether to show gallery or simple fallback
  // For variant products: gallery always renders (with placeholder when empty)
  // For simple products: fall back to primaryImageUrl only when no images
  const showGallery = hasVariants || galleryImages.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
      {/* Gallery — sticky on desktop */}
      <div className="lg:sticky lg:top-24">
        {showGallery ? (
          <ProductGallery
            images={galleryImages}
            productName={product.name ?? "Product"}
          />
        ) : (
          <ProductGalleryFallback
            imageUrl={product.primaryImageUrl}
            productName={product.name ?? "Product"}
          />
        )}
      </div>

      {/* Information panel */}
      <div className="flex flex-col gap-0">
        {/* Incomplete-combination banner */}
        {hasIncomplete && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-warning/10 border border-warning/30 px-4 py-3 mb-4"
          >
            <AlertTriangle
              className="size-4 text-warning mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="text-[13px] text-warning leading-snug">
              Some combinations are incomplete and cannot be selected. Contact
              the store administrator.
            </p>
          </div>
        )}

        <ProductInformation
          product={product}
          currency={currency}
          locale={locale}
          codEnabled={codEnabled}
          selectedVariant={selectedVariant}
          onVariantChange={setSelectedVariant}
          onVariantClear={() => setSelectedVariant(null)}
        />
      </div>
    </div>
  );
}
