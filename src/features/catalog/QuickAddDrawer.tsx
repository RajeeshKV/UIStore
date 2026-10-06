"use client";

/**
 * QuickAddDrawer — shown when a product grid card needs variant selection.
 *
 * Triggered by clicking "Choose Options" on a ProductCard. Fetches the full
 * StorefrontProductResponse (including attributes + variants) on demand, then
 * renders the ProductVariantSelector and an Add to Cart button.
 *
 * API used: GET /api/v1/store/products/{slug}
 */

import { useState, useEffect, useCallback } from "react";
import { X, ShoppingBag, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatPrice } from "@/lib/utils";
import { storeApi } from "@/services/api/store";
import { ProductVariantSelector } from "@/features/product/ProductVariantSelector";
import { Button } from "@/components/ui/Button";
import type {
  StorefrontProductSummaryResponse,
  StorefrontProductResponse,
  StorefrontVariantResponse,
} from "@/types/api";

interface QuickAddDrawerProps {
  product: StorefrontProductSummaryResponse;
  currency: string;
  locale: string;
  open: boolean;
  onClose: () => void;
  onAddToCart: (productId: string, variantId: string, quantity: number) => void;
}

export function QuickAddDrawer({
  product,
  currency,
  locale,
  open,
  onClose,
  onAddToCart,
}: QuickAddDrawerProps) {
  const [detail, setDetail] = useState<StorefrontProductResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<StorefrontVariantResponse | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!product.slug) return;
    setLoading(true);
    setError(null);
    const res = await storeApi.getProductBySlug(product.slug);
    setLoading(false);
    if (res.ok) {
      const data = res.data;
      setDetail(data);
      // Pre-select first purchasable variant
      const safeVariants = (data.variants ?? []).filter(Boolean) as StorefrontVariantResponse[];
      const initial = safeVariants.find((v) => v.canPurchase) ?? safeVariants[0] ?? null;
      setSelectedVariant(initial);
    } else {
      setError("Could not load product options. Please open the product page.");
    }
  }, [product.slug]);

  // Fetch only when drawer opens, and only once per open session
  useEffect(() => {
    if (open && !detail && !loading) void fetchDetail();
  }, [open, detail, loading, fetchDetail]);

  // Reset selection when drawer closes
  useEffect(() => {
    if (!open) {
      setAdded(false);
      setAdding(false);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const safeVariants = (detail?.variants ?? []).filter(Boolean) as StorefrontVariantResponse[];
  const hasAttributes = (detail?.attributes?.length ?? 0) > 0;
  const allAxesChosen =
    !hasAttributes ||
    (detail?.attributes?.length ?? 0) === 0 ||
    (selectedVariant != null &&
      (detail?.attributes?.length ?? 0) ===
        (selectedVariant.attributeValueIds?.split(",").filter(Boolean).length ?? 0));

  const canAdd = selectedVariant?.canPurchase === true && allAxesChosen && !adding;

  const effectivePrice = selectedVariant?.effectivePrice ?? product.price;
  const priceStr = formatPrice(effectivePrice, product.currency ?? currency, locale);

  async function handleAdd() {
    if (!selectedVariant || !canAdd) return;
    setAdding(true);
    onAddToCart(product.id, selectedVariant.id, 1);
    await new Promise((r) => setTimeout(r, 600));
    setAdding(false);
    setAdded(true);
    await new Promise((r) => setTimeout(r, 900));
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet — slides up from bottom on mobile, anchors right on desktop */}
          <motion.div
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Choose options for ${product.name}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "fixed z-50 bg-white shadow-2xl",
              // Mobile: full-width bottom sheet
              "bottom-0 left-0 right-0 rounded-t-2xl",
              // Desktop: right-anchored panel
              "md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:right-6 md:left-auto md:w-[380px] md:rounded-2xl",
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-[#E5E7EB]">
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-[#191c1e] leading-snug line-clamp-2">{product.name}</p>
                <p className="text-[16px] font-extrabold text-[#0D0D0D] mt-1 tabular-nums">{priceStr}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full border border-[#E5E7EB] text-[#5A6578] hover:text-[#191c1e] transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 flex flex-col gap-4">
              {loading && (
                <div className="flex items-center justify-center py-8 gap-2 text-[#5A6578]">
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                  <span className="text-[13px]">Loading options…</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-danger/5 border border-danger/20 px-3 py-3">
                  <AlertTriangle className="size-4 text-danger shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-[13px] text-danger">{error}</p>
                </div>
              )}

              {detail && !loading && (
                <>
                  {hasAttributes ? (
                    <ProductVariantSelector
                      variants={safeVariants}
                      attributes={detail.attributes}
                      selectedVariantId={selectedVariant?.id ?? null}
                      onSelect={setSelectedVariant}
                    />
                  ) : (
                    <p className="text-[13px] text-[#5A6578]">No options to select.</p>
                  )}

                  {/* Selected variant stock status */}
                  {selectedVariant && !selectedVariant.canPurchase && (
                    <p className="text-[12px] text-danger font-medium">
                      This combination is out of stock.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-6 pt-2">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                disabled={!canAdd || loading || !!error}
                loading={adding}
                onClick={handleAdd}
                iconLeft={!adding && !added ? <ShoppingBag className="size-4" /> : undefined}
                className="rounded-xl h-12 text-[14px]"
              >
                {added ? "Added!" : adding ? "Adding…" : canAdd ? "Add to Cart" : allAxesChosen ? "Out of Stock" : "Select options"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
