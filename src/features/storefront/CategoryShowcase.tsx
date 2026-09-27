"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { LayoutGrid } from "lucide-react";
import type { StorefrontCategoryResponse } from "@/types/api";

interface CategoryShowcaseProps {
  categories: StorefrontCategoryResponse[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function CategoryShowcase({
  categories,
  loading = false,
  error = false,
  onRetry,
}: CategoryShowcaseProps) {
  const shouldReduce = useReducedMotion();

  // On the home page, hide section entirely when there's no data to show
  if (!loading && !error && categories.length === 0) return null;

  return (
    <section aria-labelledby="categories-heading" className="py-14 md:py-20">
      <div className="container-x mx-auto">
        {/* Section header */}
        <motion.div
          variants={shouldReduce ? undefined : fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="flex items-end justify-between mb-8 md:mb-10"
        >
          <div>
            <h2
              id="categories-heading"
              className="text-h2 text-foreground"
            >
              Shop by Category
            </h2>
            <p className="mt-2 text-body-sm text-foreground-muted">
              Discover products for every corner of your home.
            </p>
          </div>
          <Link
            href="/categories"
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

        {/* States */}
        {loading && <CategoryGridSkeleton />}
        {error && !loading && (
          <ErrorState
            title="Couldn't load categories"
            onRetry={onRetry}
            inline
          />
        )}

        {/* Grid */}
        {!loading && !error && categories.length > 0 && (
          <motion.ul
            role="list"
            variants={shouldReduce ? undefined : staggerContainer(0.06, 0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className={cn(
              "grid gap-3 md:gap-4",
              "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
            )}
          >
            {categories.slice(0, 12).map((cat) => (
              <motion.li
                key={cat.id}
                variants={shouldReduce ? undefined : fadeUp}
              >
                <CategoryCard category={cat} />
              </motion.li>
            ))}
          </motion.ul>
        )}

        {/* Mobile "View All" */}
        {!loading && !error && categories.length > 0 && (
          <div className="mt-8 text-center md:hidden">
            <Link
              href="/categories"
              className="inline-flex items-center gap-1.5 text-body-sm font-medium text-foreground hover:text-foreground-muted transition-colors"
            >
              View All Categories
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Category card ─────────────────────────────────────────────────────────────

function CategoryCard({ category }: { category: StorefrontCategoryResponse }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex flex-col items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-focus rounded-lg"
      aria-label={`${category.name}${category.productCount ? ` — ${category.productCount} products` : ""}`}
    >
      {/* Image tile */}
      <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-surface">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name ?? "Category"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* Pattern placeholder */
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <span
              className="text-display font-bold text-border-strong/60 select-none"
              aria-hidden="true"
            >
              {(category.name ?? "?").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Hover overlay */}
        <div
          className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/8 transition-colors duration-300"
          aria-hidden="true"
        />
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-body-sm font-medium text-foreground group-hover:text-foreground/70 transition-colors leading-snug">
          {category.name}
        </p>
        {category.productCount != null && (
          <p className="text-caption text-foreground-muted mt-0.5">
            {category.productCount} product{category.productCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CategoryGridSkeleton() {
  return (
    <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} aria-hidden="true" className="flex flex-col items-center gap-2.5">
          <Skeleton className="w-full aspect-square rounded-lg" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}
