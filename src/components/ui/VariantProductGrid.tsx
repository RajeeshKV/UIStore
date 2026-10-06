import { cn } from "@/lib/utils";
import { VariantProductCard } from "./VariantProductCard";
import { ProductGridSkeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { ShoppingBag } from "lucide-react";
import type { GridRow } from "@/types/api";

interface VariantProductGridProps {
  rows: GridRow[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  currency?: string;
  locale?: string;
  skeletonCount?: number;
  cols?: 3 | 4 | 5 | 6;
  className?: string;
  eagerCount?: number;
}

export function VariantProductGrid({
  rows,
  loading = false,
  error = false,
  onRetry,
  currency,
  locale,
  skeletonCount = 10,
  cols = 4,
  className,
  eagerCount = 0,
}: VariantProductGridProps) {
  if (loading) return <ProductGridSkeleton count={skeletonCount} />;

  if (error) {
    return (
      <ErrorState
        title="Couldn't load products"
        description="Something went wrong. Please try again."
        onRetry={onRetry}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-8" />}
        title="No products found"
        description="Check back soon — new arrivals are on the way."
      />
    );
  }

  void cols; // reserved for future per-layout min-width tuning

  return (
    <div className={cn("grid-product-cards", className)}>
      {rows.map((row, i) => (
        <VariantProductCard
          key={row.id}
          row={row}
          currency={currency}
          locale={locale}
          eager={i < eagerCount}
        />
      ))}
    </div>
  );
}
