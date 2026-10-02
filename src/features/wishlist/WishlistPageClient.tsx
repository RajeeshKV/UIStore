"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, RefreshCw } from "lucide-react";
import { wishlistApi } from "@/services/api/wishlist";
import { useCart } from "@/features/cart/CartContext";
import { useWishlist } from "./WishlistContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { normalizeStock } from "@/types/api";
import { formatPrice, cn } from "@/lib/utils";
import type { WishlistItemResponse } from "@/types/api";

export function WishlistPageClient({
  currency,
  locale,
}: {
  currency: string;
  locale: string;
}) {
  const [items, setItems] = useState<WishlistItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [removing, setRemoving] = useState<string | null>(null);
  const { toggle } = useWishlist();
  const { addItem } = useCart();

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    const res = await wishlistApi.list(p, 20);
    if (res.ok) {
      setItems(res.data.items);
      setTotalPages(res.data.totalPages);
      setPage(p);
    } else {
      setError("Failed to load wishlist. Please try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(1); }, [load]);

  async function handleRemove(item: WishlistItemResponse) {
    setRemoving(item.productId);
    await toggle(item.productId, item.productVariantId ?? undefined);
    setItems((prev) => prev.filter((i) => i.productId !== item.productId));
    setRemoving(null);
  }

  async function handleAddToCart(item: WishlistItemResponse) {
    if (!item.canPurchase) return;
    addItem(item.productId, item.productVariantId ?? undefined, 1);
  }

  if (loading) return <WishlistSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-[14px] text-[#5A6578]">{error}</p>
        <Button variant="outline" size="sm" onClick={() => load(1)} iconLeft={<RefreshCw className="size-3.5" />}>
          Retry
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-[#f3f4f6] flex items-center justify-center">
          <Heart className="size-7 text-[#c4c7c7]" />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-[#191c1e]">Your wishlist is empty</h2>
          <p className="text-[13px] text-[#5A6578] mt-1">Save items you love and find them here later.</p>
        </div>
        <Link href="/shop">
          <Button variant="primary" size="sm">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-[#191c1e]">
          Saved Items <span className="text-[#5A6578] font-normal text-[15px]">({items.length})</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <WishlistCard
            key={item.id}
            item={item}
            currency={currency}
            locale={locale}
            removing={removing === item.productId}
            onRemove={() => handleRemove(item)}
            onAddToCart={() => handleAddToCart(item)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => load(page - 1)}
          >
            Previous
          </Button>
          <span className="text-[13px] text-[#5A6578]">Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => load(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Wishlist card ─────────────────────────────────────────────────────────────

function WishlistCard({
  item,
  currency,
  locale,
  removing,
  onRemove,
  onAddToCart,
}: {
  item: WishlistItemResponse;
  currency: string;
  locale: string;
  removing: boolean;
  onRemove: () => void;
  onAddToCart: () => void;
}) {
  const stockStr = normalizeStock(item.stockAvailability);
  const displayCurrency = item.currencyCode ?? currency;

  return (
    <div className={cn(
      "group flex gap-4 rounded-2xl border border-[#e1e2e4] bg-white p-4 transition-shadow",
      "hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]",
      removing && "opacity-50 pointer-events-none",
    )}>
      {/* Image */}
      <Link href={`/products/${item.productSlug}`} className="shrink-0">
        <div className="h-24 w-24 rounded-xl overflow-hidden bg-[#f8f9fb]">
          {item.productImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.productImageUrl}
              alt={item.productName ?? "Product"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ShoppingBag className="size-8 text-[#c4c7c7]" />
            </div>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <Link
          href={`/products/${item.productSlug}`}
          className="text-[14px] font-semibold text-[#191c1e] leading-snug hover:text-[#5A6578] transition-colors line-clamp-2"
        >
          {item.productName}
        </Link>

        {/* Price */}
        <p className="text-[15px] font-bold text-[#191c1e] tabular-nums">
          {formatPrice(item.effectivePrice, displayCurrency, locale)}
        </p>

        {/* Stock */}
        <span className={cn(
          "text-[11px] font-semibold",
          stockStr === "InStock" ? "text-success" :
          stockStr === "LowStock" ? "text-warning" :
          "text-danger",
        )}>
          {stockStr === "InStock" ? "In Stock" :
           stockStr === "LowStock" ? "Low Stock" : "Out of Stock"}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={onAddToCart}
            disabled={!item.canPurchase}
            aria-label="Add to cart"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all",
              item.canPurchase
                ? "bg-[#0D0D0D] text-white hover:bg-[#333]"
                : "bg-[#f3f4f6] text-[#c4c7c7] cursor-not-allowed",
            )}
          >
            <ShoppingBag className="size-3" />
            Add to Cart
          </button>
          <button
            onClick={onRemove}
            aria-label="Remove from wishlist"
            className="flex items-center justify-center h-7 w-7 rounded-lg text-[#5A6578] hover:text-danger hover:bg-danger/5 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function WishlistSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-7 w-40" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-2xl border border-[#e1e2e4] p-4">
            <Skeleton className="h-24 w-24 rounded-xl shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-28 mt-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
