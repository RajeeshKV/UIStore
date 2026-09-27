"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatPrice, discountPercent } from "@/lib/utils";
import { Badge } from "./Badge";
import type { StorefrontProductSummaryResponse } from "@/types/api";
import { normalizeStock } from "@/types/api";

interface ProductCardProps {
  product: StorefrontProductSummaryResponse;
  /** Currency from store settings — fallback to product.currency */
  currency?: string;
  /** Locale from store settings */
  locale?: string;
  /** Show add-to-cart action */
  onAddToCart?: (product: StorefrontProductSummaryResponse) => void;
  className?: string;
  /** Lazy load image (false for above-the-fold cards) */
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

  const effectiveCurrency = product.currency ?? currency ?? "INR";
  const effectiveLocale = locale ?? "en-IN";

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? discountPercent(product.price, product.compareAtPrice)
      : 0;

  const isOutOfStock = normalizeStock(product.stockAvailability) === "OutOfStock";
  const isLowStock = normalizeStock(product.stockAvailability) === "LowStock";

  const priceStr = formatPrice(product.price, effectiveCurrency, effectiveLocale);
  const comparePriceStr = product.compareAtPrice
    ? formatPrice(product.compareAtPrice, effectiveCurrency, effectiveLocale)
    : null;

  return (
    <article
      className={cn(
        "group relative flex flex-col",
        isOutOfStock && "opacity-70",
        className,
      )}
    >
      {/* Image container */}
      <Link
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
        tabIndex={0}
        className="block relative aspect-square overflow-hidden rounded-lg bg-surface"
      >
        {product.primaryImageUrl && !imgError ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name ?? "Product"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover object-center",
              "transition-transform duration-500 ease-out",
              "group-hover:scale-105",
            )}
            loading={eager ? "eager" : "lazy"}
            onError={() => setImgError(true)}
          />
        ) : (
          /* Placeholder when no image */
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <ShoppingBag className="size-10 text-border-strong" aria-hidden="true" />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
          {discount > 0 && (
            <Badge variant="danger" className="text-[11px] px-1.5 py-0.5">
              -{discount}%
            </Badge>
          )}
          {isLowStock && !isOutOfStock && (
            <Badge variant="warning" className="text-[11px] px-1.5 py-0.5">
              Low stock
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="muted" className="text-[11px] px-1.5 py-0.5">
              Sold out
            </Badge>
          )}
        </div>

        {/* Wishlist button */}
        <button
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isWishlisted}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted((w) => !w);
          }}
          className={cn(
            "absolute top-2 right-2 flex h-8 w-8 items-center justify-center",
            "rounded-full bg-background/90 backdrop-blur-sm",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            "transition-all duration-200 hover:scale-110",
            "focus-visible:outline-2 focus-visible:outline-focus",
          )}
        >
          <Heart
            className={cn(
              "size-3.5 transition-colors",
              isWishlisted
                ? "fill-danger text-danger"
                : "text-foreground",
            )}
          />
        </button>

        {/* Quick-view — visible on hover desktop */}
        <div
          className={cn(
            "absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0",
            "transition-transform duration-300 ease-out",
          )}
          aria-hidden="true"
        >
          <div className="m-2 flex items-center justify-center gap-1.5 rounded-md bg-background/95 backdrop-blur-sm py-2 text-caption font-medium text-foreground">
            <Eye className="size-3.5" />
            Quick view
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="mt-3 flex flex-col gap-1 flex-1">
        {/* Category */}
        {product.categoryName && (
          <p className="text-caption text-foreground-muted truncate">
            {product.categoryName}
          </p>
        )}

        {/* Name */}
        <Link
          href={`/products/${product.slug}`}
          className="text-body-sm font-medium text-foreground leading-snug line-clamp-2 hover:text-foreground/70 transition-colors"
        >
          {product.name}
        </Link>

        {/* Price row */}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-body-sm font-semibold text-foreground">
            {priceStr}
          </span>
          {comparePriceStr && (
            <span className="text-caption text-foreground-muted line-through">
              {comparePriceStr}
            </span>
          )}
        </div>

        {/* Add to cart */}
        {!isOutOfStock && (
          <button
            aria-label={`Add ${product.name} to cart`}
            disabled={!product.canPurchase}
            onClick={() => onAddToCart?.(product)}
            className={cn(
              "mt-2 w-full h-9 rounded-md text-body-sm font-medium",
              "border border-border text-foreground",
              "hover:bg-primary hover:text-primary-foreground hover:border-primary",
              "transition-colors duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            Add to cart
          </button>
        )}
        {isOutOfStock && (
          <button
            disabled
            className="mt-2 w-full h-9 rounded-md text-body-sm font-medium border border-border text-foreground-muted cursor-not-allowed opacity-60"
          >
            Out of stock
          </button>
        )}
      </div>
    </article>
  );
}
