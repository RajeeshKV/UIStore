"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Truck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatPrice, discountPercent } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/features/cart/CartContext";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { WishlistButton } from "@/features/wishlist/WishlistButton";
import { transitions } from "@/lib/motion";
import type {
  StorefrontProductResponse,
  StorefrontVariantResponse,
  StockAvailability,
} from "@/types/api";

interface ProductInformationProps {
  product: StorefrontProductResponse;
  currency: string;
  locale: string;
  codEnabled?: boolean;
  selectedVariant?: StorefrontVariantResponse | null;
  onVariantChange?: (variant: StorefrontVariantResponse) => void;
  onVariantClear?: () => void;
}

export function ProductInformation({ product, currency, locale, codEnabled = false, selectedVariant: controlledVariant, onVariantChange, onVariantClear }: ProductInformationProps) {
  const shouldReduce = useReducedMotion();
  const { addItem, isMutating } = useCart();
  const hasVariants = (product.variants?.length ?? 0) > 0;
  const safeVariants = (product.variants ?? []).filter(Boolean);

  const [internalVariant, setInternalVariant] = useState<StorefrontVariantResponse | null>(
    safeVariants.find((v) => v.canPurchase) ?? safeVariants[0] ?? null,
  );

  const selectedVariant = controlledVariant !== undefined ? controlledVariant : internalVariant;

  function handleVariantSelect(variant: StorefrontVariantResponse) {
    setInternalVariant(variant);
    onVariantChange?.(variant);
  }

  function handleVariantClear() {
    setInternalVariant(null);
    onVariantClear?.();
  }

  const effectivePrice      = selectedVariant?.effectivePrice ?? product.price;
  // Use variant-level compareAtPrice when a variant is resolved (§2 of integration guide).
  // Fall back to product-level compareAtPrice only when no variant is active.
  const effectiveCompareAt  = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const effectiveStock: StockAvailability = selectedVariant?.stockAvailability ?? product.stockAvailability;
  const effectiveCurrency   = product.currency ?? currency;

  const needsSelection = hasVariants && selectedVariant === null;
  const effectiveCanPurchase = selectedVariant !== null
    ? selectedVariant.canPurchase
    : (!hasVariants && product.canPurchase);

  let ctaText: string;
  if (needsSelection) {
    ctaText = "Select options";
  } else if (!effectiveCanPurchase) {
    ctaText = "Out of Stock";
  } else {
    ctaText = "Add to Cart";
  }

  const discount =
    effectiveCompareAt && effectiveCompareAt > effectivePrice
      ? discountPercent(effectivePrice, effectiveCompareAt)
      : 0;

  const priceStr        = formatPrice(effectivePrice, effectiveCurrency, locale);
  const comparePriceStr = effectiveCompareAt ? formatPrice(effectiveCompareAt, effectiveCurrency, locale) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Brand / category links */}
      <div className="flex items-center gap-2 flex-wrap">
        {product.brandName && product.brandSlug && (
          <Link
            href={`/brands/${product.brandSlug}`}
            className="text-[11px] font-bold tracking-[0.18em] uppercase text-secondary hover:opacity-80 transition-opacity"
          >
            {product.brandName}
          </Link>
        )}
        {product.brandName && product.categoryName && (
          <span className="text-border text-[11px]" aria-hidden="true">·</span>
        )}
        {product.categoryName && product.categorySlug && (
          <Link
            href={`/categories/${product.categorySlug}`}
            className="text-[12px] text-foreground-muted hover:text-foreground transition-colors"
          >
            {product.categoryName}
          </Link>
        )}
      </div>

      {/* Title */}
      <h1 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold text-foreground leading-tight tracking-tight">
        {product.name}
      </h1>

      {/* Star rating */}
      {(product as StorefrontProductResponse & { hasRatings?: boolean; ratingAverage?: number; ratingCount?: number }).hasRatings && (
        <div className="flex items-center gap-1.5">
          {(() => {
            const avg = (product as StorefrontProductResponse & { ratingAverage?: number }).ratingAverage ?? 0;
            const cnt = (product as StorefrontProductResponse & { ratingCount?: number }).ratingCount ?? 0;
            const filled = Math.round(avg);
            return (
              <>
                <div className="flex items-center gap-0.5" aria-label={`${avg.toFixed(1)} out of 5 stars`}>
                  {[1,2,3,4,5].map((i) => (
                    <svg key={i} viewBox="0 0 24 24" className={cn("size-4 shrink-0", i <= filled ? "fill-warning text-warning" : "fill-none text-border")} stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-[13px] font-semibold text-foreground">{avg.toFixed(1)}</span>
                <span className="text-[13px] text-foreground-muted">({cnt} review{cnt !== 1 ? "s" : ""})</span>
              </>
            );
          })()}
        </div>
      )}

      {/* Short description */}
      {product.shortDescription && (
        <p className="text-[14px] text-foreground-muted leading-relaxed">{product.shortDescription}</p>
      )}

      {/* Price block */}
      <motion.div
        key={`${effectivePrice}-${effectiveCompareAt}`}
        initial={shouldReduce ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.fast}
        className="flex items-end gap-3 flex-wrap"
      >
        <span className="text-[28px] font-extrabold text-foreground tabular-nums leading-none">
          {priceStr}
        </span>
        {comparePriceStr && (
          <span className="text-[16px] text-foreground-muted line-through tabular-nums mb-0.5">
            {comparePriceStr}
          </span>
        )}
        {discount > 0 && (
          <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-bold text-secondary-foreground leading-none uppercase tracking-wide mb-0.5">
            {discount}% off
          </span>
        )}
      </motion.div>

      {/* Stock status */}
      <StockBadge availability={effectiveStock} />

      {/* Variants */}
      {hasVariants && safeVariants.length > 0 && (
        <ProductVariantSelector
          variants={safeVariants}
          attributes={product.attributes}
          selectedVariantId={selectedVariant?.id ?? null}
          onSelect={handleVariantSelect}
          onPartialSelect={handleVariantClear}
        />
      )}

      {/* SKU */}
      {selectedVariant?.sku && (
        <p className="text-[12px] text-foreground-muted">SKU: {selectedVariant.sku}</p>
      )}

      {/* CTAs */}
      <div className="flex gap-3 mt-1">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={needsSelection || !effectiveCanPurchase || isMutating}
          loading={isMutating}
          iconLeft={!isMutating && !needsSelection ? <ShoppingBag className="size-4" /> : undefined}
          aria-label={needsSelection ? "Select all options to add to cart" : effectiveCanPurchase ? `Add ${product.name} to cart` : "Out of stock"}
          onClick={() => {
            if (needsSelection || !effectiveCanPurchase) return;
            const variantId = hasVariants ? selectedVariant?.id : undefined;
            if (hasVariants && !variantId) return;
            addItem(product.id, variantId, 1);
          }}
          className="rounded-xl h-12 text-[14px]"
        >
          {ctaText}
        </Button>
        <WishlistButton
          productId={product.id}
          variantId={selectedVariant?.id}
          size="md"
          className="h-12 w-12 rounded-xl"
        />
      </div>

      {/* Delivery estimate */}
      {product.deliveryEstimate && (
        <div className="flex items-start gap-3 rounded-xl border border-border px-4 py-3.5 bg-background">
          <Truck className="size-4 text-foreground-muted mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-[13px] font-medium text-foreground">
            {product.deliveryEstimate.description ??
              (product.deliveryEstimate.from && product.deliveryEstimate.to
                ? `Estimated delivery: ${product.deliveryEstimate.from} – ${product.deliveryEstimate.to}`
                : "Delivery estimate available at checkout")}
          </p>
        </div>
      )}

      {/* Accordions */}
      {product.description && (
        <ProductAccordion title="Product Details" defaultOpen>
          <p className="text-[13px] text-foreground-muted leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </ProductAccordion>
      )}

      {product.attributes && product.attributes.length > 0 && (
        <ProductAccordion title="Specifications">
          <table className="w-full text-[13px]">
            <tbody>
              {product.attributes.map((attr) => (
                <tr key={attr.name} className="border-b border-border last:border-none">
                  <td className="py-2 pr-4 text-foreground-muted font-semibold w-1/3 align-top">{attr.name}</td>
                  <td className="py-2 text-foreground align-top">
                    {attr.values?.map((v) => v.value).filter(Boolean).join(", ") ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ProductAccordion>
      )}

      {/* Trust badges */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-border text-[12px] text-foreground-muted">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="size-3.5 text-success" aria-hidden="true" />
          Secure checkout
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="size-3.5 text-success" aria-hidden="true" />
          Easy returns
        </span>
        <span className={cn("flex items-center gap-1.5", codEnabled ? "text-success" : "text-foreground-muted")}>
          {codEnabled ? (
            <CheckCircle className="size-3.5 text-success" aria-hidden="true" />
          ) : (
            <XCircle className="size-3.5" aria-hidden="true" />
          )}
          {codEnabled ? "COD Available" : "No COD"}
        </span>
      </div>
    </div>
  );
}

// ── Stock badge ───────────────────────────────────────────────────────────────

function StockBadge({ availability }: { availability: StockAvailability }) {
  if (availability === "InStock") {
    return (
      <p className="flex items-center gap-1.5 text-[13px] text-success font-semibold">
        <CheckCircle className="size-4" aria-hidden="true" /> In Stock
      </p>
    );
  }
  if (availability === "LowStock") {
    return (
      <p className="flex items-center gap-1.5 text-[13px] text-warning font-semibold">
        <AlertTriangle className="size-4" aria-hidden="true" /> Low Stock — Order soon
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-[13px] text-danger font-semibold">
      <XCircle className="size-4" aria-hidden="true" /> Out of Stock
    </p>
  );
}

// ── Accordion ─────────────────────────────────────────────────────────────────

function ProductAccordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const shouldReduce    = useReducedMotion();

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-[14px] font-bold text-foreground hover:text-foreground-muted transition-colors"
      >
        {title}
        <ChevronDown
          className={cn("size-4 text-foreground-muted transition-transform duration-200", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={shouldReduce ? { duration: 0 } : { ...transitions.base, opacity: { duration: 0.15 } }}
            className="overflow-hidden"
          >
            <div className="pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
