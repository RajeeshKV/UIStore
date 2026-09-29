"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CartAwareProductCard } from "@/components/ui/CartAwareProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import type { StorefrontProductSummaryResponse } from "@/types/api";

interface NewArrivalsProps {
  products: StorefrontProductSummaryResponse[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  currency?: string;
  locale?: string;
}

export function NewArrivals({ products, loading = false, error = false, currency, locale }: NewArrivalsProps) {
  if (!loading && !error && products.length === 0) return null;

  return (
    <section aria-labelledby="new-arrivals-heading" className="py-8 md:py-12 bg-surface">
      <div className="container-x mx-auto">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-foreground-muted mb-0.5">Just In</p>
            <h2 id="new-arrivals-heading" className="text-h4 font-bold text-foreground">New Arrivals</h2>
          </div>
          <Link href="/shop?sort=newest" className={cn("inline-flex items-center gap-1 text-body-sm text-foreground-muted hover:text-foreground transition-colors")}>
            See all <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {loading && <ProductGridSkeleton count={6} />}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {products.slice(0, 6).map((product, i) => (
              <CartAwareProductCard key={product.id} product={product} currency={currency} locale={locale} eager={i < 3} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
