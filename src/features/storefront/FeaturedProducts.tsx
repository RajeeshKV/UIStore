"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/ui/ProductCard";
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

export function FeaturedProducts({
  products,
  loading = false,
  error = false,
  onRetry,
  currency,
  locale,
}: FeaturedProductsProps) {
  const shouldReduce = useReducedMotion();

  // Hide section entirely when there's no data to show on the home page
  if (!loading && !error && products.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-heading"
      className="py-14 md:py-20 bg-background"
    >
      <div className="container-x mx-auto">
        {/* Header */}
        <motion.div
          variants={shouldReduce ? undefined : fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="flex items-end justify-between mb-8 md:mb-10"
        >
          <div>
            <h2 id="featured-heading" className="text-h2 text-foreground">
              Featured Products
            </h2>
            <p className="mt-2 text-body-sm text-foreground-muted">
              Handpicked for your space.
            </p>
          </div>
          <Link
            href="/shop?featured=true"
            className={cn(
              "hidden md:inline-flex items-center gap-1.5",
              "text-body-sm font-medium text-foreground",
              "hover:text-foreground-muted transition-colors",
              "focus-visible:outline-2 focus-visible:outline-focus rounded",
            )}
          >
            View All
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </motion.div>

        {/* Loading */}
        {loading && <ProductGridSkeleton count={4} />}

        {/* Error */}
        {error && !loading && (
          <ErrorState
            title="Couldn't load featured products"
            onRetry={onRetry}
            inline
          />
        )}

        {/* Grid */}
        {!loading && !error && products.length > 0 && (
          <motion.div
            variants={shouldReduce ? undefined : staggerContainer(0.07, 0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {products.slice(0, 8).map((product, i) => (
              <motion.div
                key={product.id}
                variants={shouldReduce ? undefined : fadeUp}
              >
                <ProductCard
                  product={product}
                  currency={currency}
                  locale={locale}
                  eager={i < 4}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Mobile CTA */}
        {!loading && !error && products.length > 0 && (
          <div className="mt-8 text-center md:hidden">
            <Link
              href="/shop?featured=true"
              className="inline-flex items-center gap-1.5 text-body-sm font-medium text-foreground hover:text-foreground-muted transition-colors"
            >
              View All Featured
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
