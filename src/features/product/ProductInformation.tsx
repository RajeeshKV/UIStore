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
  Heart,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatPrice, discountPercent } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/features/cart/CartContext";
import { ProductVariantSelector } from "./ProductVariantSelector";
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
}

export function ProductInformation({ product, currency, locale, codEnabled = false }: ProductInformationProps) {
  const shouldReduce = useReducedMotion();
  const { addItem, isMutating } = useCart();
  const hasVariants = (product.variants?.length ?? 0) > 0;

  const [selectedVariant, setSelectedVariant] = useState<StorefrontVariantResponse | null>(
    product.variants?.find((v) => v.canPurchase) ?? product.variants?.[0] ?? null,
  );
  const [isWishlisted, setIsWishlisted] = useState(false);

  const effectivePrice      = selectedVariant?.effectivePrice ?? product.price;
  const effectiveCompareAt  = product.compareAtPrice;
  const effectiveStock: StockAvailability = selectedVariant?.stockAvailability ?? product.stockAvailability;
  const effectiveCanPurchase = selectedVariant !== null ? selectedVariant.canPurchase : product.canPurchase;
  const effectiveCurrency   = product.currency ?? currency;

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
            className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#ba0918] hover:opacity-80 transition-opacity"
          >
            {product.brandName}
          </Link>
        )}
        {product.brandName && product.categoryName && (
          <span className="text-[#c4c7c7] text-[11px]" aria-hidden="true">·</span>
        )}
        {product.categoryName && product.categorySlug && (
          <Link
            href={`/categories/${product.categorySlug}`}
            className="text-[12px] text-[#444748] hover:text-[#191c1e] transition-colors"
          >
            {product.categoryName}
          </Link>
        )}
      </div>

      {/* Title */}
      <h1 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold text-[#191c1e] leading-tight tracking-tight">
        {product.name}
      </h1>

      {/* Short description */}
      {product.shortDescription && (
        <p className="text-[14px] text-[#444748] leading-relaxed">{product.shortDescription}</p>
      )}

      {/* Price block */}
      <motion.div
        key={`${effectivePrice}-${effectiveCompareAt}`}
        initial={shouldReduce ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.fast}
        className="flex items-end gap-3 flex-wrap"
      >
        <span className="text-[28px] font-extrabold text-[#0D0D0D] tabular-nums leading-none">
          {priceStr}
        </span>
        {comparePriceStr && (
          <span className="text-[16px] text-[#5A6578] line-through tabular-nums mb-0.5">
            {comparePriceStr}
          </span>
        )}
        {discount > 0 && (
          <span className="rounded bg-[#E02E2E] px-2 py-0.5 text-[11px] font-bold text-white leading-none uppercase tracking-wide mb-0.5">
            {discount}% off
          </span>
        )}
      </motion.div>

      {/* Stock status */}
      <StockBadge availability={effectiveStock} />

      {/* Variants */}
      {hasVariants && product.variants && (
        <ProductVariantSelector
          variants={product.variants}
          attributes={product.attributes}
          selectedVariantId={selectedVariant?.id ?? null}
          onSelect={setSelectedVariant}
        />
      )}

      {/* SKU */}
      {selectedVariant?.sku && (
        <p className="text-[12px] text-[#5A6578]">SKU: {selectedVariant.sku}</p>
      )}

      {/* CTAs */}
      <div className="flex gap-3 mt-1">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!effectiveCanPurchase || isMutating}
          loading={isMutating}
          iconLeft={!isMutating ? <ShoppingBag className="size-4" /> : undefined}
          aria-label={effectiveCanPurchase ? `Add ${product.name} to cart` : "Out of stock"}
          onClick={() => {
            if (!effectiveCanPurchase) return;
            const variantId = hasVariants ? selectedVariant?.id : undefined;
            if (hasVariants && !variantId) return;
            addItem(product.id, variantId, 1);
          }}
          className="rounded-xl h-12 text-[14px]"
        >
          {effectiveCanPurchase ? "Add to Cart" : "Out of Stock"}
        </Button>
        {/* Wishlist circle button — matches design floating controls */}
        <button
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          onClick={() => setIsWishlisted((w) => !w)}
          className={cn(
            "h-12 w-12 shrink-0 flex items-center justify-center rounded-xl",
            "border border-[#E5E7EB] bg-white",
            "hover:border-[#0D0D0D] transition-all duration-150",
            "shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
          )}
        >
          <Heart className={cn("size-5 transition-colors", isWishlisted ? "fill-[#E02E2E] text-[#E02E2E]" : "text-[#5A6578]")} />
        </button>
      </div>

      {/* Delivery estimate */}
      {product.deliveryEstimate && (
        <div className="flex items-start gap-3 rounded-xl border border-[#e1e2e4] px-4 py-3.5 bg-[#f8f9fb]">
          <Truck className="size-4 text-[#444748] mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-[13px] font-medium text-[#191c1e]">
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
          <p className="text-[13px] text-[#444748] leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </ProductAccordion>
      )}

      {product.attributes && product.attributes.length > 0 && (
        <ProductAccordion title="Specifications">
          <table className="w-full text-[13px]">
            <tbody>
              {product.attributes.map((attr) => (
                <tr key={attr.name} className="border-b border-[#e1e2e4] last:border-none">
                  <td className="py-2 pr-4 text-[#444748] font-semibold w-1/3 align-top">{attr.name}</td>
                  <td className="py-2 text-[#191c1e] align-top">
                    {attr.values?.map((v) => v.value).filter(Boolean).join(", ") ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ProductAccordion>
      )}

      {/* Trust badges */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-[#e1e2e4] text-[12px] text-[#444748]">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="size-3.5 text-success" aria-hidden="true" />
          Secure checkout
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="size-3.5 text-success" aria-hidden="true" />
          Easy returns
        </span>
        <span className={cn("flex items-center gap-1.5", codEnabled ? "text-success" : "text-[#444748]")}>
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
    <div className="border-t border-[#e1e2e4]">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-[14px] font-bold text-[#191c1e] hover:text-[#444748] transition-colors"
      >
        {title}
        <ChevronDown
          className={cn("size-4 text-[#444748] transition-transform duration-200", open && "rotate-180")}
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
