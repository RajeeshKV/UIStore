import { cn } from "@/lib/utils";
import { CartAwareProductCard } from "./CartAwareProductCard";
import { ProductGridSkeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { ShoppingBag } from "lucide-react";
import type { StorefrontProductSummaryResponse } from "@/types/api";

interface ProductGridProps {
  products: StorefrontProductSummaryResponse[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  currency?: string;
  locale?: string;
  skeletonCount?: number;
  /**
   * Hint for the minimum card width in px.
   * The grid uses auto-fill so cards are never wider than this,
   * regardless of how few items are present.
   * 3 → ~180px  (with-filter layout)
   * 4 → ~170px  (default)
   * 5 → ~155px
   * 6 → ~140px
   */
  cols?: 3 | 4 | 5 | 6;
  className?: string;
  eagerCount?: number;
}

// Maps cols hint → fixed card width in px used for auto-fill
const cardWidth: Record<number, number> = {
  3: 180,
  4: 170,
  5: 155,
  6: 140,
};

export function ProductGrid({
  products,
  loading = false,
  error = false,
  onRetry,
  currency,
  locale,
  skeletonCount = 10,
  cols = 4,
  className,
  eagerCount = 0,
}: ProductGridProps) {
  if (loading) return <ProductGridSkeleton count={skeletonCount} />;

  if (error) {
    return <ErrorState title="Couldn't load products" description="Something went wrong. Please try again." onRetry={onRetry} />;
  }

  if (products.length === 0) {
    return <EmptyState icon={<ShoppingBag className="size-8" />} title="No products found" description="Check back soon — new arrivals are on the way." />;
  }

  const px = cardWidth[cols] ?? 170;

  return (
    <div
      className={cn("grid gap-2 md:gap-3", className)}
      style={{
        // Fixed-width columns: cards never grow beyond `px` regardless of item count.
        // auto-fill packs as many columns as fit; remaining space stays empty (left-aligned).
        gridTemplateColumns: `repeat(auto-fill, ${px}px)`,
      }}
    >
      {products.map((p, i) => (
        <CartAwareProductCard key={p.id} product={p} currency={currency} locale={locale} eager={i < eagerCount} />
      ))}
    </div>
  );
}
