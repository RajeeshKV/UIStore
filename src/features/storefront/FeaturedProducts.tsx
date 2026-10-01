"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { FeaturedProductCard } from "./FeaturedProductCard";
import { useCart } from "@/features/cart/CartContext";
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
    <section
      aria-labelledby="featured-heading"
      className="py-5 md:py-6 bg-background border-t border-border"
    >
      <div className="container-x mx-auto">
        <div className="flex items-baseline justify-between mb-4">
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
          <ErrorState title="Couldn't load featured products" onRetry={onRetry} inline />
        )}

        {!loading && !error && products.length > 0 && (
          <FeaturedGrid products={products} currency={currency} locale={locale} />
        )}
      </div>
    </section>
  );
}

// Cart-aware inner grid — needs the cart context
function FeaturedGrid({
  products,
  currency,
  locale,
}: {
  products: StorefrontProductSummaryResponse[];
  currency?: string;
  locale?: string;
}) {
  const { addItem } = useCart();

  function handleAddToCart(p: StorefrontProductSummaryResponse) {
    if (p.canPurchase) addItem(p.id, undefined, 1);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {products.slice(0, 4).map((product, i) => (
        <FeaturedProductCard
          key={product.id}
          product={product}
          currency={currency}
          locale={locale}
          onAddToCart={handleAddToCart}
          eager={i < 4}
        />
      ))}
    </div>
  );
}

function FeaturedProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex flex-row items-stretch rounded-xl overflow-hidden border border-border"
        >
          <Skeleton className="shrink-0 w-[80px] h-[110px] rounded-none" />
          <div className="flex-1 px-3 py-3 space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-full rounded-md mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
