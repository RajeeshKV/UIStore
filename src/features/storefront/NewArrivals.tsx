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

interface NewArrivalsProps {
  products: StorefrontProductSummaryResponse[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  currency?: string;
  locale?: string;
}

export function NewArrivals({
  products,
  loading = false,
  error = false,
  onRetry,
  currency,
  locale,
}: NewArrivalsProps) {
  const shouldReduce = useReducedMotion();

  // Don't render section at all if no data and not loading/error
  if (!loading && !error && products.length === 0) return null;

  return (
    <section
      aria-labelledby="new-arrivals-heading"
      className="py-14 md:py-20 bg-surface"
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
            <p className="text-caption font-semibold tracking-widest uppercase text-foreground-muted mb-2">
              Just In
            </p>
            <h2 id="new-arrivals-heading" className="text-h2 text-foreground">
              New Arrivals
            </h2>
          </div>
          <Link
            href="/shop?sort=newest"
            className={cn(
              "hidden md:inline-flex items-center gap-1.5",
              "text-body-sm font-medium text-foreground",
              "hover:text-foreground-muted transition-colors",
              "focus-visible:outline-2 focus-visible:outline-focus rounded",
            )}
          >
            See All
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </motion.div>

        {/* Loading */}
        {loading && <ProductGridSkeleton count={4} />}

        {/* Error */}
        {error && !loading && (
          <ErrorState
            title="Couldn't load new arrivals"
            onRetry={onRetry}
            inline
          />
        )}

        {/* Grid — max 4 cards on homepage */}
        {!loading && !error && products.length > 0 && (
          <motion.div
            variants={shouldReduce ? undefined : staggerContainer(0.07, 0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {products.slice(0, 4).map((product) => (
              <motion.div
                key={product.id}
                variants={shouldReduce ? undefined : fadeUp}
              >
                <ProductCard
                  product={product}
                  currency={currency}
                  locale={locale}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Mobile CTA */}
        {!loading && !error && products.length > 0 && (
          <div className="mt-8 text-center md:hidden">
            <Link
              href="/shop?sort=newest"
              className="inline-flex items-center gap-1.5 text-body-sm font-medium text-foreground hover:text-foreground-muted transition-colors"
            >
              See All New Arrivals
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
