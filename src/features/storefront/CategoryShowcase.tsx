"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
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
    <section aria-labelledby="categories-heading" className="py-6 md:py-8 bg-background">
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
            className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            {categories.slice(0, 8).map((cat) => (
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

// ── Category card — matches reference: landscape, image left, text right ──────

function CategoryCard({ category }: { category: StorefrontCategoryResponse }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex items-center gap-0 rounded-xl border border-border bg-surface overflow-hidden hover:border-border-strong hover:shadow-sm transition-all duration-150 focus-visible:outline-2 focus-visible:outline-focus"
      aria-label={category.name ?? "Category"}
    >
      {/* Image — fixed square, fills left portion */}
      <div className="relative shrink-0 w-[100px] h-[88px] bg-muted overflow-hidden">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name ?? "Category"}
            fill
            sizes="100px"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span
              className="text-[28px] font-bold text-foreground-muted select-none"
              aria-hidden="true"
            >
              {(category.name ?? "?").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Text content */}
      <div className="flex flex-1 items-center justify-between px-4 min-w-0">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-foreground leading-snug truncate group-hover:text-foreground/70 transition-colors">
            {category.name}
          </p>
          {category.productCount != null ? (
            <p className="text-[12px] text-foreground-muted mt-0.5 truncate">
              {category.productCount} products
            </p>
          ) : (
            <p className="text-[12px] text-foreground-muted mt-0.5">
              Explore
            </p>
          )}
        </div>
        <ArrowRight
          className="size-4 text-foreground-muted shrink-0 ml-3 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-150"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function CategoryGridSkeleton() {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex items-center rounded-xl border border-border overflow-hidden"
        >
          <Skeleton className="shrink-0 w-[100px] h-[88px] rounded-none" />
          <div className="flex-1 px-4 flex flex-col gap-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
