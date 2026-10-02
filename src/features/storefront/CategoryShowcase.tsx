"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils";
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
  if (!loading && !error && categories.length === 0) return null;

  return (
    <section aria-labelledby="categories-heading" className="py-8 md:py-10 bg-[#f8f9fb]">
      <div className="px-5 md:px-8 lg:px-10">
        {/* Section header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2
              id="categories-heading"
              className="text-[22px] font-bold tracking-tight text-[#191c1e]"
            >
              Shop by Category
            </h2>
            <p className="text-[12px] text-[#444748] mt-0.5">
              Explore our most popular collections
            </p>
          </div>
          <Link
            href="/categories"
            className="group inline-flex items-center gap-1 text-[13px] font-bold text-[#191c1e] hover:text-[#ba0918] transition-colors whitespace-nowrap"
          >
            View All
            <ArrowRight className="size-[16px] group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>

        {loading && <CategoryGridSkeleton />}
        {error && !loading && (
          <ErrorState title="Couldn't load categories" onRetry={onRetry} inline />
        )}

        {!loading && !error && categories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.slice(0, 8).map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={shouldReduce ? undefined : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <CategoryImageCard category={cat} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Tall image-overlay card — matches the home page design reference exactly.
 * h-56 with full-cover image, gradient overlay, title + subtitle at bottom,
 * product count badge top-right, arrow circle bottom-right.
 */
export function CategoryImageCard({ category }: { category: StorefrontCategoryResponse }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group relative flex flex-col justify-between h-56 rounded-2xl overflow-hidden",
        "bg-[#edeef0] border border-[#e1e2e4]/40",
        "shadow-sm hover:shadow-xl transition-all duration-300",
        "focus-visible:outline-2 focus-visible:outline-[#0D0D0D]",
      )}
      aria-label={`${category.name}${category.productCount != null ? ` — ${category.productCount} products` : ""}`}
    >
      {/* Full-cover image */}
      {category.imageUrl ? (
        <Image
          src={category.imageUrl}
          alt={category.name ?? "Category"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#edeef0] to-[#d9dadc]" />
      )}

      {/* Gradient overlay — bottom-up */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#191c1e] via-[#191c1e]/40 to-transparent"
        aria-hidden="true"
      />

      {/* Product count badge — top right */}
      {category.productCount != null && (
        <div className="relative z-10 p-3.5 flex justify-end">
          <span className="px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-md border border-white/60 text-[11px] font-bold text-[#191c1e] tracking-wider uppercase shadow-sm">
            {category.productCount} products
          </span>
        </div>
      )}

      {/* Spacer when no badge */}
      {category.productCount == null && <div className="flex-1" />}

      {/* Bottom content */}
      <div className="relative z-10 p-4 flex items-end justify-between">
        <div>
          <h3 className="text-[16px] font-bold text-white leading-snug group-hover:text-white transition-colors">
            {category.name}
          </h3>
          <span className="text-[11px] text-white/70 font-medium">Explore collection</span>
        </div>
        {/* Arrow circle */}
        <div
          className={cn(
            "w-9 h-9 rounded-full bg-white/90 backdrop-blur-md border border-white/60",
            "flex items-center justify-center text-[#191c1e] shadow-sm",
            "group-hover:bg-[#0D0D0D] group-hover:border-[#0D0D0D] group-hover:text-white",
            "transition-all duration-300",
          )}
          aria-hidden="true"
        >
          <ArrowRight className="size-4" />
        </div>
      </div>
    </Link>
  );
}

/**
 * Tall editorial card for the Categories page — matches Designs/categories reference.
 * Taller (h-80 image) with description text and "Explore Category" link.
 */
export function CategoryEditorialCard({ category }: { category: StorefrontCategoryResponse }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group relative overflow-hidden rounded-3xl",
        "bg-white border border-[#e1e2e4]/40",
        "shadow-sm hover:shadow-xl transition-all duration-500",
        "flex flex-col",
        "focus-visible:outline-2 focus-visible:outline-[#0D0D0D]",
      )}
      aria-label={`${category.name}${category.productCount != null ? ` — ${category.productCount} products` : ""}`}
    >
      {/* Image area — h-80 */}
      <div className="relative w-full h-80 overflow-hidden bg-[#edeef0]">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name ?? "Category"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#edeef0] to-[#d9dadc] flex items-center justify-center">
            <span className="text-6xl font-bold text-[#0D0D0D]/10 select-none" aria-hidden="true">
              {(category.name ?? "?").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Product count badge — top right */}
        {category.productCount != null && (
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-[#191c1e] tracking-wider uppercase shadow-sm border border-white/60">
            {category.productCount} Products
          </span>
        )}
      </div>

      {/* Text content */}
      <div className="p-7 flex flex-col flex-1 justify-between gap-5">
        <div className="flex flex-col gap-2">
          <h3 className="text-[20px] font-bold text-[#191c1e] tracking-tight group-hover:text-[#ba0918] transition-colors duration-300">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-[14px] text-[#444748] leading-relaxed line-clamp-3">
              {category.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#e1e2e4]/60 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#0D0D0D] group-hover:text-[#ba0918] transition-colors">
            Explore Category
            <ArrowRight className="size-[17px] group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </span>
          <div
            className={cn(
              "w-9 h-9 rounded-full bg-[#f3f4f6] border border-[#e1e2e4]",
              "flex items-center justify-center text-[#191c1e]",
              "group-hover:bg-[#0D0D0D] group-hover:border-[#0D0D0D] group-hover:text-white",
              "transition-all duration-300",
            )}
            aria-hidden="true"
          >
            <ArrowRight className="size-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} aria-hidden="true" className="h-56 w-full rounded-2xl" />
      ))}
    </div>
  );
}

// ── Skeleton for editorial grid (categories page) ─────────────────────────────

export function CategoryEditorialGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} aria-hidden="true" className="rounded-3xl overflow-hidden border border-[#e1e2e4] bg-white">
          <Skeleton className="h-80 w-full rounded-none" />
          <div className="p-7 flex flex-col gap-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
