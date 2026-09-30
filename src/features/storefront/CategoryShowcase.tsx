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

export function CategoryShowcase({ categories, loading = false, error = false, onRetry }: CategoryShowcaseProps) {
  if (!loading && !error && categories.length === 0) return null;

  return (
    <section aria-labelledby="categories-heading" className="py-8 md:py-12 bg-surface border-y border-border">
      <div className="container-x mx-auto">
        {/* Compact header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 id="categories-heading" className="text-h4 font-bold text-foreground">Shop by Category</h2>
          <Link href="/categories" className="inline-flex items-center gap-1 text-body-sm text-foreground-muted hover:text-foreground transition-colors">
            View all <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {loading && <CategoryGridSkeleton />}
        {error && !loading && <ErrorState title="Couldn't load categories" onRetry={onRetry} inline />}

        {!loading && !error && categories.length > 0 && (
          <ul
            role="list"
            className="grid gap-2 md:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
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

function CategoryCard({ category }: { category: StorefrontCategoryResponse }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex flex-col items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-focus rounded-lg"
      aria-label={`${category.name}${category.productCount ? ` — ${category.productCount} products` : ""}`}
    >
      {/* Image — aspect-square matches product card */}
      <div className="relative w-full aspect-square overflow-hidden rounded-md bg-muted border border-border">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name ?? "Category"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12vw"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span className="text-h3 font-bold text-foreground-muted select-none" aria-hidden="true">
              {(category.name ?? "?").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/6 transition-colors duration-200" aria-hidden="true" />
      </div>

      {/* Label */}
      <div className="text-center w-full px-0.5">
        <p className="text-[11px] font-semibold text-foreground group-hover:text-foreground/70 transition-colors leading-snug truncate">
          {category.name}
        </p>
        {category.productCount != null && (
          <p className="text-[10px] text-foreground-muted">{category.productCount}</p>
        )}
      </div>
    </Link>
  );
}

function CategoryGridSkeleton() {
  return (
    <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} aria-hidden="true" className="flex flex-col items-center gap-1.5">
          <Skeleton className="w-full aspect-[4/3] rounded-md" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
