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
  cols?: 4 | 5 | 6;
  className?: string;
  eagerCount?: number;
}

// 5 per row on desktop — compact catalog grid
const colClasses: Record<number, string> = {
  4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
};

export function ProductGrid({
  products,
  loading = false,
  error = false,
  onRetry,
  currency,
  locale,
  skeletonCount = 10,
  cols = 5,
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

  return (
    <div className={cn("grid gap-2 md:gap-3", colClasses[cols] ?? colClasses[5], className)}>
      {products.map((p, i) => (
        <CartAwareProductCard key={p.id} product={p} currency={currency} locale={locale} eager={i < eagerCount} />
      ))}
    </div>
  );
}
