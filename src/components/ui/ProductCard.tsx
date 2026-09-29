"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
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

  const effectiveCurrency = product.currency ?? currency ?? "INR";
  const effectiveLocale = locale ?? "en-IN";

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? discountPercent(product.price, product.compareAtPrice)
      : 0;

  const stockState = normalizeStock(product.stockAvailability);
  const isOutOfStock = stockState === "OutOfStock";
  const isLowStock = stockState === "LowStock";

  const priceStr = formatPrice(product.price, effectiveCurrency, effectiveLocale);
  const comparePriceStr = product.compareAtPrice && product.compareAtPrice > product.price
    ? formatPrice(product.compareAtPrice, effectiveCurrency, effectiveLocale)
    : null;

  return (
    <article className={cn("group relative flex flex-col", isOutOfStock && "opacity-65", className)}>
      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
        className="block relative aspect-[4/3] overflow-hidden rounded-md bg-surface"
      >
        {product.primaryImageUrl && !imgError ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name ?? "Product"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-103"
            loading={eager ? "eager" : "lazy"}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <ShoppingBag className="size-8 text-border-strong" aria-hidden="true" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 pointer-events-none">
          {discount > 0 && (
            <span className="inline-flex items-center rounded bg-danger px-1 py-0.5 text-[10px] font-semibold text-white leading-none">
              -{discount}%
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="inline-flex items-center rounded bg-warning px-1 py-0.5 text-[10px] font-semibold text-white leading-none">
              Low stock
            </span>
          )}
          {isOutOfStock && (
            <span className="inline-flex items-center rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-foreground-muted leading-none border border-border">
              Sold out
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isWishlisted}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsWishlisted(w => !w); }}
          className={cn(
            "absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center",
            "rounded-full bg-background/85 backdrop-blur-sm",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            "transition-opacity duration-150",
            "focus-visible:outline-2 focus-visible:outline-focus",
          )}
        >
          <Heart className={cn("size-3 transition-colors", isWishlisted ? "fill-danger text-danger" : "text-foreground")} />
        </button>

        {/* Add to cart overlay — appears on hover, not a full button row */}
        {!isOutOfStock && product.canPurchase && onAddToCart && (
          <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out">
            <button
              aria-label={`Add ${product.name} to cart`}
              onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
              className="w-full py-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-[11px] font-semibold tracking-wide uppercase hover:bg-primary transition-colors"
            >
              Add to cart
            </button>
          </div>
        )}
      </Link>

      {/* Info — compact */}
      <div className="mt-2 flex flex-col gap-0.5">
        {product.categoryName && (
          <p className="text-[10px] text-foreground-muted truncate uppercase tracking-wide">{product.categoryName}</p>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="text-[12px] font-medium text-foreground leading-snug line-clamp-2 hover:text-foreground/70 transition-colors"
        >
          {product.name}
        </Link>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-[13px] font-semibold text-foreground">{priceStr}</span>
          {comparePriceStr && (
            <span className="text-[11px] text-foreground-muted line-through">{comparePriceStr}</span>
          )}
        </div>
        {isOutOfStock && (
          <p className="text-[10px] text-foreground-muted">Out of stock</p>
        )}
      </div>
    </article>
  );
}
