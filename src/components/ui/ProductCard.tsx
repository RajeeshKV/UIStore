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
        "group relative flex flex-col rounded-xl overflow-hidden border border-border bg-background",
        "hover:border-border-strong hover:shadow-md transition-all duration-200",
        isOutOfStock && "opacity-70",
        className,
      )}
    >
      {/* Wishlist — always visible top-right */}
      <button
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={isWishlisted}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsWishlisted((w) => !w);
        }}
        className={cn(
          "absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full",
          "bg-background/80 border border-border/60",
          "transition-colors duration-150",
        )}
      >
        <Heart
          className={cn(
            "size-3.5 transition-colors",
            isWishlisted ? "fill-danger text-danger" : "text-foreground-muted",
          )}
        />
      </button>

      {/* Badges — top left */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
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

      {/* Image */}
      <div className="aspect-square w-full bg-surface">
        <Link
          href={`/products/${product.slug}`}
          aria-label={`View ${product.name}`}
          className="relative block w-full h-full overflow-hidden"
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
        </Link>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-1.5">
        {/* Name */}
        <Link
          href={`/products/${product.slug}`}
          className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2 hover:text-foreground/70 transition-colors"
        >
          {product.name}
        </Link>

        {/* Stars */}
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

        {/* Colour swatches */}
        <ColorSwatches product={product} />

        {/* Add to Cart button */}
        {!isOutOfStock && product.canPurchase && onAddToCart ? (
          <button
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            disabled={addingToCart}
            className={cn(
              "mt-1 w-full flex items-center justify-center gap-1.5",
              "h-9 rounded-md text-[12px] font-semibold",
              "bg-foreground text-background",
              "hover:bg-foreground/85 active:scale-[0.98] transition-all duration-150",
              "disabled:opacity-60",
            )}
          >
            <ShoppingBag className="size-3.5" aria-hidden="true" />
            {addingToCart ? "Adding..." : "Add to Cart"}
          </button>
        ) : isOutOfStock ? (
          <p className="mt-1 text-[11px] text-center text-foreground-muted">Out of stock</p>
        ) : null}
      </div>
    </article>
  );
}

function ColorSwatches({ product }: { product: StorefrontProductSummaryResponse }) {
  if (!product.brandName && !product.categoryName) return null;
  const swatches = ["bg-[#1a1a1a]", "bg-[#d4d4d4]"];
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {swatches.map((cls, i) => (
        <span
          key={i}
          className={cn("w-3 h-3 rounded-full border border-border/60", cls)}
        />
      ))}
    </div>
  );
}
