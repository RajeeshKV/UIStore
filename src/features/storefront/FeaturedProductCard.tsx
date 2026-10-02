"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { cn, formatPrice, discountPercent } from "@/lib/utils";
import type { StorefrontProductSummaryResponse } from "@/types/api";
import { normalizeStock } from "@/types/api";

interface FeaturedProductCardProps {
  product: StorefrontProductSummaryResponse;
  currency?: string;
  locale?: string;
  onAddToCart?: (product: StorefrontProductSummaryResponse) => void;
  eager?: boolean;
}

/**
 * Matches the design reference exactly:
 * - bg-white rounded-2xl p-5, border, subtle shadow
 * - Discount badge top-left (crimson pill)
 * - Wishlist top-right (circle button)
 * - Image inside a contained rounded-xl bg area (not edge-to-edge)
 * - Title, price row, Add to Cart CTA
 */
export function FeaturedProductCard({
  product,
  currency,
  locale,
  onAddToCart,
  eager = false,
}: FeaturedProductCardProps) {
  const [imgError, setImgError]         = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onAddToCart || addingToCart || isOutOfStock) return;
    setAddingToCart(true);
    onAddToCart(product);
    setTimeout(() => setAddingToCart(false), 800);
  };

  return (
    <motion.article
      whileHover={{ y: -3, boxShadow: "0 16px 40px rgba(0,0,0,0.10)" }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        // Design reference: bg-white rounded-2xl p-5 border shadow-sm
        "group relative flex flex-col bg-white rounded-2xl p-4",
        "border border-[#e1e2e4]/60 shadow-sm",
        "transition-shadow duration-300",
        isOutOfStock && "opacity-70",
      )}
    >
      {/* ── Top row: badge left + wishlist right ────────────────────────── */}
      <div className="flex items-center justify-between w-full mb-3">
        {/* Discount badge — crimson pill */}
        {discount > 0 && !isOutOfStock ? (
          <span className="bg-[#E02E2E] text-white text-[10px] px-2.5 py-0.5 rounded-full font-extrabold tracking-wider uppercase shadow-sm">
            -{discount}%
          </span>
        ) : isOutOfStock ? (
          <span className="bg-[#f3f4f6] text-[#5A6578] text-[10px] px-2.5 py-0.5 rounded-full font-semibold">
            Out of stock
          </span>
        ) : (
          <span />
        )}

        {/* Wishlist button */}
        <button
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsWishlisted((w) => !w); }}
          className="w-8 h-8 rounded-full bg-[#f3f4f6] text-[#5A6578] hover:text-[#E02E2E] hover:bg-[#fff0f0] flex items-center justify-center transition-all duration-150"
        >
          <Heart className={cn("size-3.5", isWishlisted && "fill-[#E02E2E] text-[#E02E2E]")} />
        </button>
      </div>

      {/* ── Image — contained in a rounded bg area ───────────────────────── */}
      <Link
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
        className="block w-full rounded-xl bg-[#f8f9fb] overflow-hidden mb-4 group-hover:bg-[#f3f4f6] transition-colors"
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
            <ShoppingBag className="size-10 text-[#D1D5DB]" aria-hidden="true" />
          </div>
        )}
      </Link>

      {/* ── Product info ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 flex-1">
        <Link
          href={`/products/${product.slug}`}
          className="text-[13px] font-bold text-[#191c1e] line-clamp-1 hover:text-[#0D0D0D]/70 transition-colors leading-snug"
        >
          {product.name}
        </Link>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-[20px] font-black text-[#191c1e] leading-none tabular-nums">
            {priceStr}
          </span>
          {comparePriceStr && (
            <span className="text-[12px] text-[#5A6578] line-through tabular-nums">
              {comparePriceStr}
            </span>
          )}
        </div>
      </div>

      {/* ── Add to Cart CTA ───────────────────────────────────────────────── */}
      {!isOutOfStock && product.canPurchase && onAddToCart ? (
        <button
          onClick={handleAddToCart}
          aria-label={`Add ${product.name} to cart`}
          disabled={addingToCart}
          className={cn(
            "mt-4 w-full flex items-center justify-center gap-2",
            "py-3 px-4 rounded-xl",
            "bg-[#0D0D0D] text-white text-[13px] font-bold tracking-wide",
            "hover:bg-[#262626] active:scale-[0.98] transition-all duration-150",
            "shadow-md hover:shadow-lg",
            "disabled:opacity-60",
          )}
        >
          <ShoppingBag className="size-4" aria-hidden="true" />
          {addingToCart ? "Adding…" : "Add to Cart"}
        </button>
      ) : isOutOfStock ? (
        <p className="mt-4 text-[12px] text-center text-[#5A6578] py-2.5 rounded-xl bg-[#f3f4f6]">
          Out of stock
        </p>
      ) : null}
    </motion.article>
  );
}
