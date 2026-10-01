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

  const priceStr = formatPrice(product.price, effectiveCurrency, effectiveLocale);
  const comparePriceStr =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? formatPrice(product.compareAtPrice, effectiveCurrency, effectiveLocale)
      : null;

  return (
    <article
      className={cn(
        "group flex flex-col rounded-lg overflow-hidden border border-border",
        "hover:border-border-strong hover:shadow-sm transition-all duration-150",
        isOutOfStock && "opacity-60",
        className,
      )}
    >
      {/* Image area */}
      <Link
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
        className="relative block w-full aspect-square overflow-hidden bg-surface"
      >
        {product.primaryImageUrl && !imgError ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name ?? "Product"}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 20vw, 15vw"
            className="object-contain object-center transition-transform duration-300 group-hover:scale-105 p-2"
            loading={eager ? "eager" : "lazy"}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="size-6 text-foreground-muted/40" aria-hidden="true" />
          </div>
        )}

        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute top-1.5 left-1.5 rounded bg-danger px-1.5 py-0.5 text-[9px] font-bold text-white leading-none pointer-events-none">
            -{discount}%
          </span>
        )}

        {/* Out of stock / low stock overlay badge */}
        {isOutOfStock && (
          <span className="absolute top-1.5 left-1.5 rounded bg-foreground/80 px-1.5 py-0.5 text-[9px] font-bold text-background leading-none pointer-events-none">
            Out of stock
          </span>
        )}
        {!isOutOfStock && !discount && stockState === "LowStock" && (
          <span className="absolute top-1.5 left-1.5 rounded bg-warning px-1.5 py-0.5 text-[9px] font-bold text-white leading-none pointer-events-none">
            Low stock
          </span>
        )}

        {/* Wishlist */}
        <button
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsWishlisted(w => !w); }}
          className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        >
          <Heart className={cn("size-3", isWishlisted ? "fill-danger text-danger" : "text-foreground-muted")} />
        </button>

        {/* Add to cart — slides up on hover */}
        {!isOutOfStock && product.canPurchase && onAddToCart && (
          <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            <button
              onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
              aria-label={`Add ${product.name} to cart`}
              className="w-full py-1.5 bg-primary/90 text-primary-foreground text-[10px] font-semibold uppercase tracking-wide"
            >
              Add to cart
            </button>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-0.5 px-2.5 py-2 border-t border-border bg-background">
        {product.categoryName && (
          <p className="text-[9px] text-foreground-muted uppercase tracking-wide truncate">{product.categoryName}</p>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="text-[11px] font-medium text-foreground leading-tight line-clamp-2 hover:text-foreground/70 transition-colors"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[12px] font-bold text-foreground">{priceStr}</span>
          {comparePriceStr && (
            <span className="text-[10px] text-foreground-muted line-through">{comparePriceStr}</span>
          )}
        </div>
        {isOutOfStock && (
          <p className="text-[9px] text-foreground-muted">Out of stock</p>
        )}
        {!isOutOfStock && stockState === "LowStock" && (
          <p className="text-[9px] font-medium text-warning">Only a few left</p>
        )}
      </div>
    </article>
  );
}
