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
    <section aria-labelledby="categories-heading" className="py-6 md:py-8 bg-background border-y border-border">
      <div className="container-x mx-auto">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <h2
            id="categories-heading"
            className="text-[18px] md:text-[20px] font-bold text-foreground tracking-tight"
          >
            Shop by Category
          </h2>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-foreground hover:text-foreground/60 transition-colors"
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
            className="grid gap-2 md:gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
          >
            {categories.slice(0, 16).map((cat) => (
              <li key={cat.id}>
                <CategoryCard category={cat} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ── Category card — same style as BrandCard ───────────────────────────────────

function CategoryCard({ category }: { category: StorefrontCategoryResponse }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group flex flex-col items-center gap-1.5 p-2.5 rounded-md",
        "border border-border hover:border-border-strong hover:bg-surface",
        "transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-focus",
      )}
      aria-label={category.name ?? "Category"}
    >
      {/* Image — no outline, fills the container cleanly */}
      <div className="relative h-10 w-full flex items-center justify-center overflow-hidden">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name ?? "Category"}
            fill
            sizes="(max-width: 640px) 80px, 100px"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span
            className="text-[18px] font-bold text-foreground-muted select-none"
            aria-hidden="true"
          >
            {(category.name ?? "?").charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name */}
      <p className="text-[11px] font-medium text-foreground-muted group-hover:text-foreground transition-colors truncate w-full text-center leading-tight">
        {category.name}
      </p>

      {/* Count */}
      {category.productCount != null && (
        <p className="text-[10px] text-foreground-muted/70 text-center leading-none">
          {category.productCount}
        </p>
      )}
    </Link>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function CategoryGridSkeleton() {
  return (
    <div className="grid gap-2 md:gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex flex-col items-center gap-1.5 p-2.5 rounded-md border border-border"
        >
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}
