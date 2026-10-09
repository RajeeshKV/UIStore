"use client";

/**
 * VariantProductCard — renders one row from GET /api/v1/store/products/variants.
 *
 * Key rules from guide 41:
 * - `row.id` is the row's own id. POST it as `variantId` to cart.
 * - `row.variantId` is null for simple products (no variants). POST null to cart.
 * - Image fallback: variant primary → variant first → primaryImageUrl → placeholder.
 * - Gate add-to-cart on `canPurchase` only — it already encodes isActive + stock.
 * - `stockAvailability` renders as a badge; never show unit counts.
 * - `effectivePrice` is the final price; never show product.price alongside it.
 */

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatPrice, discountPercent } from "@/lib/utils";
import { normalizeStock } from "@/types/api";
import type { GridRow } from "@/types/api";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useCart } from "@/features/cart/CartContext";
import { pendingCartItem } from "@/lib/pendingCartItem";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Image fallback chain (guide 41 §3.2):
 * 1. Primary image from the images array (isPrimary flag)
 * 2. First image from the images array
 * 3. primaryImageUrl (top-level, pre-resolved by grid endpoint)
 * 4. placeholder (null)
 *
 * The API returns `url` on GridImage; `secureUrl` accepted as fallback.
 */
function resolveImage(row: GridRow): string | null {
  function imgSrc(img: GridRow["images"][number]): string | null {
    return img.url ?? img.secureUrl ?? null;
  }
  const primary = row.images.find((i) => i.isPrimary);
  if (primary) {
    const src = imgSrc(primary);
    if (src) return src;
  }
  for (const img of row.images) {
    const src = imgSrc(img);
    if (src) return src;
  }
  return row.primaryImageUrl ?? null;
}

function StarRating({ average, count }: { average: number; count: number }) {
  if (!count) return null;
  const filled = Math.round(average);
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5" aria-label={`${average.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "size-3 shrink-0",
              i <= filled ? "fill-warning text-warning" : "fill-none text-border",
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="text-[11px] text-foreground-muted tabular-nums">
        {average.toFixed(1)} <span className="text-border-strong">({count})</span>
      </span>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface VariantProductCardProps {
  row: GridRow;
  currency?: string;
  locale?: string;
  eager?: boolean;
}

export function VariantProductCard({
  row,
  currency,
  locale,
  eager = false,
}: VariantProductCardProps) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { wishedIds, toggle } = useWishlist();
  const router = useRouter();

  const [imgError, setImgError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const isWishlisted = wishedIds.has(row.productId);

  const effectiveCurrency = row.currency ?? currency ?? "INR";
  const effectiveLocale = locale ?? "en-IN";

  const priceStr = formatPrice(row.effectivePrice, effectiveCurrency, effectiveLocale);
  const comparePriceStr =
    row.compareAtPrice && row.compareAtPrice > row.effectivePrice
      ? formatPrice(row.compareAtPrice, effectiveCurrency, effectiveLocale)
      : null;
  const discount =
    row.compareAtPrice && row.compareAtPrice > row.effectivePrice
      ? discountPercent(row.effectivePrice, row.compareAtPrice)
      : 0;

  const stockState = normalizeStock(row.stockAvailability);
  const isOutOfStock = stockState === "OutOfStock";
  const isLowStock = stockState === "LowStock";

  const imageUrl = imgError ? null : resolveImage(row);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!row.canPurchase || addingToCart) return;

    if (!isAuthenticated) {
      pendingCartItem.save({
        productId: row.productId,
        variantId: row.variantId ?? undefined,
        quantity: 1,
      });
      const redirect = typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/";
      router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    setAddingToCart(true);
    addItem(row.productId, row.variantId ?? undefined, 1);
    setTimeout(() => setAddingToCart(false), 800);
  }

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(
        `/auth/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`,
      );
      return;
    }
    await toggle(row.productId);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden border border-border bg-surface-elevated",
        "hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06)] transition-shadow duration-200",
        isOutOfStock && "opacity-70",
      )}
    >
      {/* ── Image ───────────────────────────────────────────────────────── */}
      <div className="relative aspect-square w-full bg-surface-container overflow-hidden">

        {/* Discount badge */}
        {discount > 0 && !isOutOfStock && (
          <span className="absolute top-2.5 left-2.5 z-10 rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-secondary-foreground leading-none uppercase tracking-wide pointer-events-none">
            -{discount}%
          </span>
        )}

        {/* Stock badges */}
        {isOutOfStock && (
          <span className="absolute top-2.5 left-2.5 z-10 rounded bg-primary/70 px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground leading-none pointer-events-none">
            Out of stock
          </span>
        )}
        {!isOutOfStock && isLowStock && (
          <span className="absolute top-2.5 left-2.5 z-10 rounded bg-warning px-1.5 py-0.5 text-[9px] font-bold text-white leading-none pointer-events-none">
            Low stock
          </span>
        )}

        {/* Wishlist */}
        <button
          type="button"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          onClick={handleWishlist}
          className={cn(
            "absolute top-2.5 right-2.5 z-10",
            "flex h-8 w-8 items-center justify-center rounded-full",
            "bg-surface-elevated border shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
            "hover:border-border transition-all duration-150",
            isWishlisted ? "border-secondary" : "border-border",
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className={cn(
              "size-3.5 transition-all duration-150",
              isWishlisted
                ? "fill-secondary stroke-secondary"
                : "fill-none stroke-foreground-muted",
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
        <Link
          href={row.variantId ? `/products/${row.slug}?variant=${row.variantId}` : `/products/${row.slug}`}
          aria-label={`View ${row.name}${
            row.variantAttributes && row.variantAttributes.length > 0
              ? ` — ${row.variantAttributes.map((a) => a.value).join(", ")}`
              : row.variantDescription
              ? ` — ${row.variantDescription}`
              : ""
          }`}
          className="block w-full h-full"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={row.name ?? "Product"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className="object-contain object-center transition-transform duration-300 group-hover:scale-105 p-3"
              loading={eager ? "eager" : "lazy"}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBag className="size-8 text-border" aria-hidden="true" />
            </div>
          )}
        </Link>
      </div>

      {/* ── Info ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 px-3 pt-3 pb-3 gap-2">

        {/* Name */}
        <Link
          href={row.variantId ? `/products/${row.slug}?variant=${row.variantId}` : `/products/${row.slug}`}
          className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2 hover:text-foreground/70 transition-colors"
        >
          {row.name}
        </Link>

        {/* Variant label — attribute values only, e.g. "Orange · 256GB" */}
        {(() => {
          if (row.variantAttributes && row.variantAttributes.length > 0) {
            return (
              <p className="text-[11px] text-foreground-muted leading-tight -mt-1 truncate">
                {row.variantAttributes.map((a) => a.value).join(" · ")}
              </p>
            );
          }
          if (row.variantDescription) {
            return (
              <p className="text-[11px] text-foreground-muted leading-tight -mt-1 truncate">
                {row.variantDescription}
              </p>
            );
          }
          return null;
        })()}

        {/* Star rating */}
        {row.ratingCount > 0 && (
          <StarRating average={row.ratingAverage} count={row.ratingCount} />
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[15px] font-extrabold text-foreground leading-none">
            {priceStr}
          </span>
          {comparePriceStr && (
            <span className="text-[12px] text-foreground-muted line-through">{comparePriceStr}</span>
          )}
        </div>

        <div className="flex-1" />

        {/* CTA */}
        {isOutOfStock ? (
          <p className="mt-0.5 text-[11px] text-center text-foreground-muted py-1">Out of stock</p>
        ) : row.canPurchase ? (
          <button
            onClick={handleAddToCart}
            aria-label={`Add ${row.name} to cart`}
            disabled={addingToCart}
            className={cn(
              "mt-0.5 w-full flex items-center justify-center gap-1.5",
              "h-9 rounded-lg text-[12px] font-bold",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 active:scale-[0.98] transition-all duration-150",
              "disabled:opacity-60",
            )}
          >
            <ShoppingBag className="size-3.5" aria-hidden="true" />
            {addingToCart ? "Adding…" : "Add to Cart"}
          </button>
        ) : null}
      </div>
    </motion.article>
  );
}
