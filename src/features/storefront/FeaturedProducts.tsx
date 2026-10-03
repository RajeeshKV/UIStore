"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { FeaturedProductCard } from "./FeaturedProductCard";
import { useCart } from "@/features/cart/CartContext";
import { useAuth } from "@/features/auth/AuthContext";
import { pendingCartItem } from "@/lib/pendingCartItem";
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
  const shouldReduce = useReducedMotion();
  if (!loading && !error && products.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-heading"
      className="py-8 md:py-12 bg-white border-t border-[#e1e2e4]"
    >
      <div className="px-5 md:px-8 lg:px-10">
        {/* Section header */}
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#ba0918] mb-1.5">
              Hand-picked
            </p>
            <h2
              id="featured-heading"
              className="text-[26px] md:text-[32px] font-extrabold text-[#191c1e] tracking-tight leading-none"
            >
              Featured Products
            </h2>
          </div>
          <Link
            href="/shop?featured=true"
            className={cn(
              "hidden sm:inline-flex items-center gap-1.5",
              "h-9 px-5 rounded-full border border-[#D1D5DB] bg-white",
              "text-[13px] font-semibold text-[#191c1e]",
              "hover:border-[#0D0D0D] transition-colors",
            )}
          >
            View All <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {loading && <FeaturedProductsSkeleton />}
        {error && !loading && (
          <ErrorState title="Couldn't load featured products" onRetry={onRetry} inline />
        )}

        {!loading && !error && products.length > 0 && (
          <FeaturedGrid
            products={products}
            currency={currency}
            locale={locale}
            shouldReduce={shouldReduce ?? false}
          />
        )}

        {/* Mobile view all */}
        <div className="sm:hidden mt-5 flex justify-center">
          <Link
            href="/shop?featured=true"
            className={cn(
              "inline-flex items-center gap-1.5",
              "h-9 px-5 rounded-full border border-[#D1D5DB] bg-white",
              "text-[13px] font-semibold text-[#191c1e]",
            )}
          >
            View All <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturedGrid({
  products,
  currency,
  locale,
  shouldReduce,
}: {
  products: StorefrontProductSummaryResponse[];
  currency?: string;
  locale?: string;
  shouldReduce: boolean;
}) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  function handleAddToCart(p: StorefrontProductSummaryResponse) {
    if (!isAuthenticated) {
      pendingCartItem.save({ productId: p.id, variantId: undefined, quantity: 1 });
      const redirect = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    if (p.canPurchase) addItem(p.id, undefined, 1);
  }

  return (
    <div
      className="grid gap-5"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
    >
      {products.slice(0, 4).map((product, i) => (
        <motion.div
          key={product.id}
          initial={shouldReduce ? undefined : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
        >
          <FeaturedProductCard
            product={product}
            currency={currency}
            locale={locale}
            onAddToCart={handleAddToCart}
            eager={i < 4}
          />
        </motion.div>
      ))}
    </div>
  );
}

function FeaturedProductsSkeleton() {
  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} aria-hidden="true" className="flex flex-col gap-2">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
