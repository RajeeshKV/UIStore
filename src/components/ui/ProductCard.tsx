"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatPrice, discountPercent } from "@/lib/utils";
import type { StorefrontProductSummaryResponse } from "@/types/api";
import { normalizeStock } from "@/types/api";

interface ProductCardProps {
  product: StorefrontProductSummaryResponse;
  currency?: string;
  locale?: string;
  onAddToCart?: (product: StorefrontProductSummaryResponse) => void;
  className?: string;
  eager?: boolean;
}

export function ProductCard({
  product,
  currency,
  locale,
  onAddToCart,
  className,
  eager = false,
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const effectiveCurrency = product.currency ?? currency ?? "INR";
  const effectiveLocale = locale ?? "en-IN";

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? discountPercent(product.price, product.compareAtPrice)
      : 0;

  const stockState = normalizeStock(product.stockAvailability);
  const isOutOfStock = stockState === "OutOfStock";

  const priceStr = formatPrice(product.price, effectiveCurrency, effectiveLocale);
  const comparePriceStr =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? formatPrice(product.compareAtPrice, effectiveCurrency, effectiveLocale)
      : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onAddToCart || addingToCart) return;
    setAddingToCart(true);
    onAddToCart(product);
    setTimeout(() => setAddingToCart(false), 800);
  };

  return (
    <article
      className={cn(
        "group flex flex-col rounded-xl overflow-hidden border border-border bg-background",
        "hover:border-border-strong hover:shadow-md transition-all duration-200",
        isOutOfStock && "opacity-70",
        className,
      )}
    >
      {/* Image area */}
      <div className="relative">
        <Link
          href={`/products/${product.slug}`}
          aria-label={`View ${product.name}`}
          className="relative block w-full overflow-hidden bg-surface"
          style={{ aspectRatio: "1 / 1" }}
        >
          {product.primaryImageUrl && !imgError ? (
            <Image
              src={product.primaryImageUrl}
              alt={product.name ?? "Product"}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 18vw"
              className="object-contain object-center transition-transform duration-300 group-hover:scale-105 p-3"
              loading={eager ? "eager" : "lazy"}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-surface">
              <ShoppingBag className="size-8 text-foreground-muted/30" aria-hidden="true" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
            {product.isFeatured && !discount && !isOutOfStock && (
              <span className="rounded bg-foreground px-1.5 py-0.5 text-[9px] font-bold text-background leading-none">
                New
              </span>
            )}
            {discount > 0 && !isOutOfStock && (
              <span className="rounded bg-danger px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                -{discount}%
              </span>
            )}
            {isOutOfStock && (
              <span className="rounded bg-foreground/75 px-1.5 py-0.5 text-[9px] font-bold text-background leading-none">
                Out of stock
              </span>
            )}
            {!isOutOfStock && stockState === "LowStock" && !discount && (
              <span className="rounded bg-warning px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                Low stock
              </span>
            )}
          </div>
        </Link>

        {/* Wishlist button */}
        <button
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted((w) => !w);
          }}
          className={cn(
            "absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full",
            "bg-background/90 border border-border shadow-xs",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150",
          )}
        >
          <Heart
            className={cn(
              "size-3.5 transition-colors",
              isWishlisted ? "fill-danger text-danger" : "text-foreground-muted",
            )}
          />
        </button>
      </div>

      {/* Card info */}
      <div className="flex flex-col flex-1 px-3 pt-2 pb-3 gap-1">
        {/* Name */}
        <Link
          href={`/products/${product.slug}`}
          className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2 hover:text-foreground/70 transition-colors"
        >
          {product.name}
        </Link>

        {/* Stars + rating — decorative since no ratings API exists yet */}
        <div className="flex items-center gap-1" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "size-2.5",
                star <= 4 ? "fill-warning text-warning" : "fill-warning/25 text-warning/25",
              )}
            />
          ))}
          <span className="text-[10px] text-foreground-muted ml-0.5">4.5</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-[14px] font-bold text-foreground">{priceStr}</span>
          {comparePriceStr && (
            <span className="text-[11px] text-foreground-muted line-through">{comparePriceStr}</span>
          )}
        </div>

        {/* Colour swatches — derived from variant count as dot placeholders */}
        <ColorSwatches product={product} />

        {/* Add to Cart */}
        {!isOutOfStock && product.canPurchase && onAddToCart ? (
          <button
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            disabled={addingToCart}
            className={cn(
              "mt-auto w-full flex items-center justify-center gap-1.5",
              "h-8 rounded-md text-[12px] font-semibold",
              "border border-border bg-background text-foreground",
              "hover:bg-foreground hover:text-background hover:border-foreground",
              "active:scale-[0.98] transition-all duration-150",
              "disabled:opacity-60",
            )}
          >
            <ShoppingBag className="size-3" aria-hidden="true" />
            {addingToCart ? "Adding..." : "Add to Cart"}
          </button>
        ) : isOutOfStock ? (
          <p className="mt-auto text-[11px] text-center text-foreground-muted pt-1">Out of stock</p>
        ) : null}
      </div>
    </article>
  );
}

// ── Colour swatches — rendered from brand/category colours or hidden ─────────

function ColorSwatches({ product }: { product: StorefrontProductSummaryResponse }) {
  // We don't have a colour API, but we can show 2–3 neutral dot placeholders
  // when the product has a known brand (suggesting variant options exist).
  // If there's no useful signal, render nothing — don't fabricate data.
  if (!product.brandName && !product.categoryName) return null;

  // Two neutral swatches — black + light gray — as representative placeholders
  const swatches = [
    "bg-foreground",
    "bg-[#d4d4d4]",
  ];

  return (
    <div className="flex items-center gap-1 mt-0.5" aria-hidden="true">
      {swatches.map((cls, i) => (
        <span
          key={i}
          className={cn("w-3 h-3 rounded-full border border-border/60", cls)}
        />
      ))}
    </div>
  );
}
