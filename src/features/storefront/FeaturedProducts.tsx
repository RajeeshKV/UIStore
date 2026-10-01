"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CartAwareProductCard } from "@/components/ui/CartAwareProductCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { StorefrontProductSummaryResponse } from "@/types/api";

interface FeaturedProductsProps {
  products: StorefrontProductSummaryResponse[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  currency?: string;
  locale?: string;
}

export function FeaturedProducts({
  products,
  loading = false,
  error = false,
  onRetry,
  currency,
  locale,
}: FeaturedProductsProps) {
  if (!loading && !error && products.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="py-8 md:py-10 bg-background border-t border-border">
      <div className="container-x mx-auto">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-5">
          <h2
            id="featured-heading"
            className="text-[22px] md:text-[26px] font-bold text-foreground tracking-tight leading-none"
          >
            Featured Products
          </h2>
          <Link
            href="/shop?featured=true"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-foreground hover:text-foreground/60 transition-colors"
          >
            View All <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {loading && <FeaturedProductsSkeleton />}
        {error && !loading && (
          <ErrorState
            title="Couldn't load featured products"
            onRetry={onRetry}
            inline
          />
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {products.slice(0, 8).map((product, i) => (
              <CartAwareProductCard
                key={product.id}
                product={product}
                currency={currency}
                locale={locale}
                eager={i < 4}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} aria-hidden="true" className="flex flex-col gap-2 rounded-xl border border-border p-3">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-full rounded-md mt-1" />
        </div>
      ))}
    </div>
  );
}
