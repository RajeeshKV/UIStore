"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CartAwareProductCard } from "@/components/ui/CartAwareProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import type { StorefrontProductSummaryResponse } from "@/types/api";

interface FeaturedProductsProps {
  products: StorefrontProductSummaryResponse[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  currency?: string;
  locale?: string;
}

export function FeaturedProducts({ products, loading = false, error = false, onRetry, currency, locale }: FeaturedProductsProps) {
  if (!loading && !error && products.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="py-8 md:py-12 bg-background">
      <div className="container-x mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 id="featured-heading" className="text-h4 font-bold text-foreground">Featured Products</h2>
          <Link href="/shop?featured=true" className={cn("inline-flex items-center gap-1 text-body-sm text-foreground-muted hover:text-foreground transition-colors")}>
            View all <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {loading && <ProductGridSkeleton count={8} />}
        {error && !loading && <ErrorState title="Couldn't load featured products" onRetry={onRetry} inline />}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
            {products.slice(0, 12).map((product, i) => (
              <CartAwareProductCard key={product.id} product={product} currency={currency} locale={locale} eager={i < 6} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
