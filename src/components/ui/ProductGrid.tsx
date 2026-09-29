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
  /** Number of grid columns at large breakpoint */
  cols?: 3 | 4 | 5;
  className?: string;
  /** Mark first N images as eager-loaded */
  eagerCount?: number;
}

const colClasses: Record<number, string> = {
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
};

export function ProductGrid({
  products,
  loading = false,
  error = false,
  onRetry,
  currency,
  locale,
  skeletonCount = 8,
  cols = 4,
  className,
  eagerCount = 0,
}: ProductGridProps) {
  if (loading) {
    return <ProductGridSkeleton count={skeletonCount} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn't load products"
        description="Something went wrong. Please try again."
        onRetry={onRetry}
      />
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-10" />}
        title="No products found"
        description="Check back soon — new arrivals are on the way."
      />
    );
  }

  return (
    <div
      className={cn(
        "grid gap-3 md:gap-4",
        colClasses[cols] ?? colClasses[4],
        className,
      )}
    >
      {products.map((p, i) => (
        <CartAwareProductCard
          key={p.id}
          product={p}
          currency={currency}
          locale={locale}
          eager={i < eagerCount}
        />
      ))}
    </div>
  );
}
