"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { StorefrontBrandResponse } from "@/types/api";

interface BrandShowcaseProps {
  brands: StorefrontBrandResponse[];
  loading?: boolean;
}

export function BrandShowcase({ brands, loading = false }: BrandShowcaseProps) {
  const activeBrands = brands.filter((b) => b.name?.trim());
  if (!loading && activeBrands.length === 0) return null;

  return (
    <section
      aria-labelledby="brands-heading"
      className="py-8 md:py-10 bg-background border-t border-border"
    >
      <div className="container-x mx-auto">
        <div className="flex items-baseline justify-between mb-5">
          <h2
            id="brands-heading"
            className="text-[22px] md:text-[26px] font-bold text-foreground tracking-tight leading-none"
          >
            Brands
          </h2>
          <Link
            href="/brands"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-foreground hover:text-foreground/60 transition-colors whitespace-nowrap"
          >
            View all <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <BrandGridSkeleton />
        ) : (
          <ul
            role="list"
            className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4"
          >
            {activeBrands.slice(0, 8).map((brand) => (
              <li key={brand.id}>
                <BrandHorizontalCard brand={brand} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ── Exported for reuse in the full brands page ────────────────────────────────

export function BrandHorizontalCard({
  brand,
}: {
  brand: StorefrontBrandResponse;
}) {
  return (
    <Link
      href={`/brands/${brand.slug}`}
      className={cn(
        "group flex items-center gap-0 rounded-xl overflow-hidden border border-border bg-surface",
        "hover:border-border-strong hover:shadow-md",
        "transition-all duration-200 focus-visible:outline-2 focus-visible:outline-focus",
      )}
      aria-label={`${brand.name}${brand.productCount != null ? ` — ${brand.productCount} products` : ""}`}
    >
      {/* Logo area — neutral bg, logo contained with padding */}
      <div className="relative shrink-0 w-[110px] h-[110px] bg-muted overflow-hidden flex items-center justify-center">
        {brand.logoUrl ? (
          <Image
            src={brand.logoUrl}
            alt={brand.name ?? "Brand"}
            fill
            sizes="110px"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span
            className="text-4xl font-bold text-foreground/10 select-none"
            aria-hidden="true"
          >
            {(brand.name ?? "?").charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 px-4 py-3">
        <p className="text-[14px] font-bold text-foreground leading-snug tracking-tight truncate">
          {brand.name}
        </p>
        {brand.productCount != null && (
          <p className="text-[12px] text-foreground-muted mt-0.5">
            {brand.productCount} products
          </p>
        )}
      </div>

      {/* Arrow */}
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

function BrandGridSkeleton() {
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
