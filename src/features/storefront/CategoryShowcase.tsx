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
    <section
      aria-labelledby="categories-heading"
      className="py-8 md:py-10 bg-background"
    >
      <div className="container-x mx-auto">
        {/* Section header */}
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <h2
              id="categories-heading"
              className="text-[22px] md:text-[26px] font-bold text-foreground tracking-tight leading-none"
            >
              Shop by Category
            </h2>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-foreground hover:text-foreground/60 transition-colors whitespace-nowrap"
          >
            View All <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {loading && <CategoryGridSkeleton />}
        {error && !loading && (
          <ErrorState title="Couldn't load categories" onRetry={onRetry} inline />
        )}

        {!loading && !error && categories.length > 0 && (
          <ul
            role="list"
            className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4"
          >
            {categories.slice(0, 8).map((cat) => (
              <li key={cat.id}>
                <CategoryHorizontalCard category={cat} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ── Exported for reuse in the full categories page ────────────────────────────

export function CategoryHorizontalCard({
  category,
}: {
  category: StorefrontCategoryResponse;
}) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group flex items-center gap-0 rounded-xl overflow-hidden border border-border bg-surface",
        "hover:border-border-strong hover:shadow-md",
        "transition-all duration-200 focus-visible:outline-2 focus-visible:outline-focus",
      )}
      aria-label={`${category.name}${category.productCount != null ? ` — ${category.productCount} products` : ""}`}
    >
      {/* Square image — fixed width so text has room */}
      <div className="relative shrink-0 w-[110px] h-[110px] bg-muted overflow-hidden">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name ?? "Category"}
            fill
            sizes="110px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-4xl font-bold text-foreground/10 select-none"
              aria-hidden="true"
            >
              {(category.name ?? "?").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 px-4 py-3">
        <p className="text-[14px] font-bold text-foreground leading-snug tracking-tight truncate">
          {category.name}
        </p>
        {category.productCount != null && (
          <p className="text-[12px] text-foreground-muted mt-0.5">
            {category.productCount} products
          </p>
        )}
      </div>

      {/* Arrow — inverts on hover */}
      <div
        className={cn(
          "shrink-0 mr-3 w-7 h-7 rounded-full border border-border",
          "flex items-center justify-center text-foreground-muted",
          "group-hover:bg-foreground group-hover:border-foreground group-hover:text-background",
          "transition-all duration-200",
        )}
        aria-hidden="true"
      >
        <ArrowRight className="size-3.5" />
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CategoryGridSkeleton() {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex items-center gap-0 rounded-xl overflow-hidden border border-border bg-surface"
        >
          <Skeleton className="shrink-0 w-[110px] h-[110px] rounded-none" />
          <div className="flex-1 px-4 py-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
