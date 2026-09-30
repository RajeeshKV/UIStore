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
import { Badge } from "@/components/ui/Badge";
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
  /** Whether Cash on Delivery is enabled for this store. Controls the COD badge. */
  codEnabled?: boolean;
}

export function ProductInformation({
  product,
  currency,
  locale,
  codEnabled = false,
}: ProductInformationProps) {
  const shouldReduce = useReducedMotion();
  const { addItem, isMutating } = useCart();
  const hasVariants = (product.variants?.length ?? 0) > 0;

  const [selectedVariant, setSelectedVariant] = useState<StorefrontVariantResponse | null>(
    // Default to first purchasable variant, else first variant
    product.variants?.find((v) => v.canPurchase) ??
      product.variants?.[0] ??
      null,
  );
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Effective price — variant overrides product-level using effectivePrice
  const effectivePrice = selectedVariant?.effectivePrice ?? product.price;
  // Variants don't carry compareAtPrice — use product-level only
  const effectiveCompareAt = product.compareAtPrice;
  const effectiveStock: StockAvailability =
    selectedVariant?.stockAvailability ?? product.stockAvailability;
  const effectiveCanPurchase =
    selectedVariant !== null
      ? selectedVariant.canPurchase
      : product.canPurchase;

  const effectiveCurrency = product.currency ?? currency;
  const discount =
    effectiveCompareAt && effectiveCompareAt > effectivePrice
      ? discountPercent(effectivePrice, effectiveCompareAt)
      : 0;

  const priceStr = formatPrice(effectivePrice, effectiveCurrency, locale);
  const comparePriceStr = effectiveCompareAt
    ? formatPrice(effectiveCompareAt, effectiveCurrency, locale)
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Brand + Category chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {product.brandName && product.brandSlug && (
          <Link
            href={`/brands/${product.brandSlug}`}
            className="text-caption font-semibold tracking-wide uppercase text-foreground-muted hover:text-foreground transition-colors"
          >
            {product.brandName}
          </Link>
        )}
        {product.brandName && product.categoryName && (
          <span className="text-border-strong text-caption" aria-hidden="true">·</span>
        )}
        {product.categoryName && product.categorySlug && (
          <Link
            href={`/categories/${product.categorySlug}`}
            className="text-caption text-foreground-muted hover:text-foreground transition-colors"
          >
            {product.categoryName}
          </Link>
        )}
      </div>

      {/* Title */}
      <h1 className="text-h1 text-foreground leading-tight">{product.name}</h1>

      {/* Short description */}
      {product.shortDescription && (
        <p className="text-body text-foreground-muted leading-relaxed">
          {product.shortDescription}
        </p>
      )}

      {/* Price */}
      <motion.div
        key={`${effectivePrice}-${effectiveCompareAt}`}
        initial={shouldReduce ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.fast}
        className="flex items-end gap-3 flex-wrap"
      >
        <span className="text-h2 font-bold text-foreground tabular-nums">
          {priceStr}
        </span>
        {comparePriceStr && (
          <span className="text-body-lg text-foreground-muted line-through tabular-nums">
            {comparePriceStr}
          </span>
        )}
        {discount > 0 && (
          <Badge variant="danger" className="mb-1">
            {discount}% off
          </Badge>
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
        <p className="text-caption text-foreground-muted">
          SKU: {selectedVariant.sku}
        </p>
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
          aria-label={
            effectiveCanPurchase
              ? `Add ${product.name} to cart`
              : "Out of stock"
          }
          onClick={() => {
            if (!effectiveCanPurchase) return;
            // If product has variants, a variant must be selected
            const variantId = hasVariants ? (selectedVariant?.id) : undefined;
            if (hasVariants && !variantId) return;
            addItem(product.id, variantId, 1);
          }}
        >
          {effectiveCanPurchase ? "Add to Cart" : "Out of Stock"}
        </Button>
        <button
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          onClick={() => setIsWishlisted((w) => !w)}
          className={cn(
            "h-12 w-12 shrink-0 flex items-center justify-center rounded-md",
            "border border-border transition-colors duration-150",
            "hover:border-foreground-muted",
            "focus-visible:outline-2 focus-visible:outline-focus",
          )}
        >
          <Heart
            className={cn(
              "size-5 transition-colors",
              isWishlisted ? "fill-danger text-danger" : "text-foreground",
            )}
          />
        </button>
      </div>

      {/* Delivery estimate */}
      {product.deliveryEstimate && (
        <div className="flex items-start gap-3 rounded-lg border border-border px-4 py-3 bg-surface">
          <Truck className="size-4 text-foreground-muted mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-body-sm font-medium text-foreground">
              {product.deliveryEstimate.description ??
                (product.deliveryEstimate.from && product.deliveryEstimate.to
                  ? `Estimated delivery: ${product.deliveryEstimate.from} – ${product.deliveryEstimate.to}`
                  : "Delivery estimate available at checkout")}
            </p>
          </div>
        </div>
      )}

      {/* Description accordion */}
      {product.description && (
        <ProductAccordion title="Product Details" defaultOpen>
          {/* Render description as plain text to avoid unsafe HTML injection */}
          <p className="text-body-sm text-foreground-muted leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </ProductAccordion>
      )}

      {/* Attributes */}
      {product.attributes && product.attributes.length > 0 && (
        <ProductAccordion title="Specifications">
          <table className="w-full text-body-sm">
            <tbody>
              {product.attributes.map((attr) => (
                <tr key={attr.name} className="border-b border-border last:border-none">
                  <td className="py-2 pr-4 text-foreground-muted font-medium w-1/3 align-top">
                    {attr.name}
                  </td>
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
      <div className="flex flex-wrap gap-4 pt-2 border-t border-border text-caption text-foreground-muted">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="size-3.5 text-success" aria-hidden="true" />
          Secure checkout
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="size-3.5 text-success" aria-hidden="true" />
          Easy returns
        </span>
        {/* COD availability — driven by admin payment settings */}
        <span
          className={cn(
            "flex items-center gap-1.5",
            codEnabled ? "text-success" : "text-foreground-muted",
          )}
          title={codEnabled ? "Cash on Delivery is available" : "Cash on Delivery is not available for this store"}
        >
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
      <p className="flex items-center gap-1.5 text-body-sm text-success font-medium">
        <CheckCircle className="size-4" aria-hidden="true" />
        In Stock
      </p>
    );
  }
  if (availability === "LowStock") {
    return (
      <p className="flex items-center gap-1.5 text-body-sm text-warning font-medium">
        <AlertTriangle className="size-4" aria-hidden="true" />
        Low Stock — Order soon
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-body-sm text-danger font-medium">
      <XCircle className="size-4" aria-hidden="true" />
      Out of Stock
    </p>
  );
}

// ── Accordion ─────────────────────────────────────────────────────────────────

interface ProductAccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function ProductAccordion({
  title,
  children,
  defaultOpen = false,
}: ProductAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const shouldReduce = useReducedMotion();

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between py-4",
          "text-body-sm font-semibold text-foreground",
          "hover:text-foreground-muted transition-colors",
        )}
      >
        {title}
        <ChevronDown
          className={cn(
            "size-4 text-foreground-muted transition-transform duration-200",
            open && "rotate-180",
          )}
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
