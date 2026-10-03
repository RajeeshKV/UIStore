"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatPrice, discountPercent } from "@/lib/utils";
import type { StorefrontProductSummaryResponse } from "@/types/api";
import { normalizeStock } from "@/types/api";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { useAuth } from "@/features/auth/AuthContext";

// ── Star rating display ───────────────────────────────────────────────────────

function StarRating({ average, count }: { average: number; count: number }) {
  // Don't show when no reviews
  if (!count || count === 0) return null;

  const filled = Math.round(average);
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5" aria-label={`${average.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "size-3 shrink-0",
              i <= filled ? "fill-[#F59E0B] text-[#F59E0B]" : "fill-none text-[#D1D5DB]",
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="text-[11px] text-[#5A6578] tabular-nums">
        {average.toFixed(1)} <span className="text-[#c4c7c7]">({count})</span>
      </span>
    </div>
  );
}

// ── Product card ──────────────────────────────────────────────────────────────

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
  const isLowStock   = stockState === "LowStock";

  const priceStr = formatPrice(product.price, effectiveCurrency, effectiveLocale);
  const comparePriceStr =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? formatPrice(product.compareAtPrice, effectiveCurrency, effectiveLocale)
      : null;

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
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden border border-[#E5E7EB] bg-white",
        "hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06)] transition-shadow duration-200",
        isOutOfStock && "opacity-70",
        className,
      )}
    >
      {/* ── Image area ───────────────────────────────────────────────────── */}
      <div className="relative aspect-square w-full bg-[#F4F5F7] overflow-hidden">
        {/* Discount badge */}
        {discount > 0 && !isOutOfStock && (
          <span className="absolute top-2.5 left-2.5 z-10 rounded bg-[#E02E2E] px-1.5 py-0.5 text-[9px] font-bold text-white leading-none uppercase tracking-wide pointer-events-none">
            -{discount}%
          </span>
        )}
        {/* Out of stock badge */}
        {isOutOfStock && (
          <span className="absolute top-2.5 left-2.5 z-10 rounded bg-[#0D0D0D]/70 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none pointer-events-none">
            Out of stock
          </span>
        )}
        {/* Low stock */}
        {!isOutOfStock && isLowStock && (
          <span className="absolute top-2.5 left-2.5 z-10 rounded bg-warning px-1.5 py-0.5 text-[9px] font-bold text-white leading-none pointer-events-none">
            Low stock
          </span>
        )}

        {/* Wishlist — top-right, wired to WishlistContext */}
        <button
          type="button"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          onClick={handleWishlist}
          className={cn(
            "absolute top-2.5 right-2.5 z-10",
            "flex h-8 w-8 items-center justify-center rounded-full",
            "bg-white border shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
            "hover:border-[#D1D5DB] transition-all duration-150",
            isWishlisted ? "border-[#E02E2E]" : "border-[#E5E7EB]",
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className={cn(
              "size-3.5 transition-all duration-150",
              isWishlisted
                ? "fill-[#E02E2E] stroke-[#E02E2E]"
                : "fill-none stroke-[#5A6578]",
            )}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Product image */}
        <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`} className="block w-full h-full">
          {product.primaryImageUrl && !imgError ? (
            <Image
              src={product.primaryImageUrl}
              alt={product.name ?? "Product"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className="object-contain object-center transition-transform duration-300 group-hover:scale-105 p-3"
              loading={eager ? "eager" : "lazy"}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBag className="size-8 text-[#D1D5DB]" aria-hidden="true" />
            </div>
          )}
        </Link>
      </div>

      {/* ── Info area ────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 px-3 pt-3 pb-3 gap-2">
        {/* Name — 2-line clamp */}
        <Link
          href={`/products/${product.slug}`}
          className="text-[13px] font-semibold text-[#191c1e] leading-snug line-clamp-2 hover:text-[#0D0D0D]/70 transition-colors"
        >
          {product.name}
        </Link>

        {/* Star rating — only when hasRatings or ratingCount > 0 */}
        {(product.hasRatings || (product.ratingCount ?? 0) > 0) && (
          <StarRating
            average={product.ratingAverage ?? 0}
            count={product.ratingCount ?? 0}
          />
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[15px] font-extrabold text-[#0D0D0D] leading-none">{priceStr}</span>
          {comparePriceStr && (
            <span className="text-[12px] text-[#5A6578] line-through">{comparePriceStr}</span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Add to Cart */}
        {!isOutOfStock && product.canPurchase && onAddToCart ? (
          <button
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            disabled={addingToCart}
            className={cn(
              "mt-0.5 w-full flex items-center justify-center gap-1.5",
              "h-9 rounded-lg text-[12px] font-bold",
              "bg-[#0D0D0D] text-white",
              "hover:bg-[#262626] active:scale-[0.98] transition-all duration-150",
              "disabled:opacity-60",
            )}
          >
            <ShoppingBag className="size-3.5" aria-hidden="true" />
            {addingToCart ? "Adding…" : "Add to Cart"}
          </button>
        ) : isOutOfStock ? (
          <p className="mt-0.5 text-[11px] text-center text-[#5A6578] py-1">Out of stock</p>
        ) : null}
      </div>
    </motion.article>
  );
}
