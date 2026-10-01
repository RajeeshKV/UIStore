"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
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
  if (!loading && !error && categories.length === 0) return null;

  return (
    <section aria-labelledby="categories-heading" className="py-8 md:py-12 bg-background">
      <div className="container-x mx-auto">
        {/* Section header */}
        <div className="flex items-end justify-between mb-2">
          <div>
            <h2
              id="categories-heading"
              className="text-[22px] md:text-[26px] font-bold text-foreground tracking-tight leading-none"
            >
              Shop by Category
            </h2>
            <p className="text-[13px] text-foreground-muted mt-1.5 leading-snug">
              Discover products for every corner of your home.
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-foreground hover:text-foreground/60 transition-colors whitespace-nowrap pb-0.5"
          >
            View All <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-5">
          {loading && <CategoryGridSkeleton />}
          {error && !loading && (
            <ErrorState title="Couldn't load categories" onRetry={onRetry} inline />
          )}

          {!loading && !error && categories.length > 0 && (
            <ul
              role="list"
              className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
            >
              {categories.slice(0, 12).map((cat) => (
                <li key={cat.id}>
                  <CategoryCard category={cat} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Category card ─────────────────────────────────────────────────────────────

function CategoryCard({ category }: { category: StorefrontCategoryResponse }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group flex flex-col rounded-xl overflow-hidden border border-border",
        "hover:border-border-strong hover:shadow-md",
        "transition-all duration-250 focus-visible:outline-2 focus-visible:outline-focus",
      )}
      aria-label={`${category.name}${category.productCount != null ? ` — ${category.productCount} products` : ""}`}
    >
      {/* Image — tall portrait ratio */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name ?? "Category"}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 17vw"
            className="object-cover transition-transform duration-350 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span
              className="text-3xl font-bold text-border-strong/40 select-none"
              aria-hidden="true"
            >
              {(category.name ?? "?").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 bg-background">
        <p className="text-[13px] font-semibold text-foreground truncate leading-snug group-hover:text-foreground/70 transition-colors">
          {category.name}
        </p>
        {category.productCount != null && (
          <p className="text-[11px] text-foreground-muted mt-0.5">
            {category.productCount}+ Products
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CategoryGridSkeleton() {
  return (
    <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} aria-hidden="true" className="rounded-xl overflow-hidden border border-border">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="px-3 py-2.5 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
