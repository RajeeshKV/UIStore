"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn, formatPrice, discountPercent } from "@/lib/utils";
import type { StorefrontProductSummaryResponse } from "@/types/api";
import { normalizeStock } from "@/types/api";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { useAuth } from "@/features/auth/AuthContext";

interface FeaturedProductCardProps {
  product: StorefrontProductSummaryResponse;
  currency?: string;
  locale?: string;
  onAddToCart?: (product: StorefrontProductSummaryResponse) => void;
  eager?: boolean;
}

export function FeaturedProductCard({
  product,
  currency,
  locale,
  onAddToCart,
  eager = false,
}: FeaturedProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const { wishedIds, toggle } = useWishlist();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const isWishlisted = wishedIds.has(product.id);

  const effectiveCurrency = product.currency ?? currency ?? "INR";
  const effectiveLocale   = locale ?? "en-IN";

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? discountPercent(product.price, product.compareAtPrice)
      : 0;

  const stockState   = normalizeStock(product.stockAvailability);
  const isOutOfStock = stockState === "OutOfStock";

  const priceStr = formatPrice(product.price, effectiveCurrency, effectiveLocale);
  const comparePriceStr =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? formatPrice(product.compareAtPrice, effectiveCurrency, effectiveLocale)
      : null;

  const hasRatings = product.hasRatings || (product.ratingCount ?? 0) > 0;
  const ratingAvg = product.ratingAverage ?? 0;
  const ratingCount = product.ratingCount ?? 0;
  const filledStars = Math.round(ratingAvg);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onAddToCart || addingToCart || isOutOfStock) return;
    setAddingToCart(true);
    onAddToCart(product);
    setTimeout(() => setAddingToCart(false), 800);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`);
      return;
    }
    await toggle(product.id);
  };

  return (
    <motion.article
      whileHover={{ y: -3, boxShadow: "0 16px 40px rgba(0,0,0,0.10)" }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative flex flex-col bg-surface-elevated rounded-2xl p-4",
        "border border-border/60 shadow-sm",
        "transition-shadow duration-300",
        isOutOfStock && "opacity-70",
      )}
    >
      {/* Top row: badge + wishlist */}
      <div className="flex items-center justify-between w-full mb-3">
        {discount > 0 && !isOutOfStock ? (
          <span className="bg-secondary text-secondary-foreground text-[10px] px-2.5 py-0.5 rounded-full font-extrabold tracking-wider uppercase shadow-sm">
            -{discount}%
          </span>
        ) : isOutOfStock ? (
          <span className="bg-muted text-foreground-muted text-[10px] px-2.5 py-0.5 rounded-full font-semibold">
            Out of stock
          </span>
        ) : (
          <span />
        )}

        <button
          type="button"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          onClick={handleWishlist}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150",
            isWishlisted
              ? "bg-secondary/10 text-secondary"
              : "bg-muted text-foreground-muted hover:text-secondary hover:bg-secondary/10",
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className={cn(
              "size-3.5 transition-all duration-150",
              isWishlisted ? "fill-secondary stroke-secondary" : "fill-none stroke-current",
            )}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
        className="block w-full rounded-xl bg-background overflow-hidden mb-4 group-hover:bg-muted transition-colors"
        style={{ aspectRatio: "1/1" }}
      >
        {product.primaryImageUrl && !imgError ? (
          <div className="relative w-full h-full p-3">
            <Image
              src={product.primaryImageUrl}
              alt={product.name ?? "Product"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className="object-contain transition-transform duration-300 group-hover:scale-105 p-1"
              loading={eager ? "eager" : "lazy"}
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="size-10 text-border" aria-hidden="true" />
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-1 flex-1">
        <Link
          href={`/products/${product.slug}`}
          className="text-[13px] font-bold text-foreground line-clamp-1 hover:text-foreground/70 transition-colors leading-snug"
        >
          {product.name}
        </Link>

        {hasRatings && (
          <div className="flex items-center gap-1 mt-0.5">
            <div className="flex items-center gap-0.5" aria-label={`${ratingAvg.toFixed(1)} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-3 shrink-0",
                    i <= filledStars ? "fill-warning text-warning" : "fill-none text-border",
                  )}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="text-[11px] text-foreground-muted">
              {ratingAvg.toFixed(1)} <span className="text-border">({ratingCount})</span>
            </span>
          </div>
        )}

        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-[20px] font-black text-foreground leading-none tabular-nums">
            {priceStr}
          </span>
          {comparePriceStr && (
            <span className="text-[12px] text-foreground-muted line-through tabular-nums">
              {comparePriceStr}
            </span>
          )}
        </div>
      </div>

      {/* Add to Cart */}
      {!isOutOfStock && product.canPurchase && onAddToCart ? (
        <button
          onClick={handleAddToCart}
          aria-label={`Add ${product.name} to cart`}
          disabled={addingToCart}
          className={cn(
            "mt-4 w-full flex items-center justify-center gap-2",
            "py-3 px-4 rounded-xl",
            "bg-primary text-primary-foreground text-[13px] font-bold tracking-wide",
            "hover:bg-primary/90 active:scale-[0.98] transition-all duration-150",
            "shadow-md hover:shadow-lg disabled:opacity-60",
          )}
        >
          <ShoppingBag className="size-4" aria-hidden="true" />
          {addingToCart ? "Adding…" : "Add to Cart"}
        </button>
      ) : isOutOfStock ? (
        <p className="mt-4 text-[12px] text-center text-foreground-muted py-2.5 rounded-xl bg-muted">
          Out of stock
        </p>
      ) : null}
    </motion.article>
  );
}
