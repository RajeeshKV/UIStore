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

/**
 * Renders only when there are active brands with content.
 * Completely hidden when brands array is empty.
 */
export function BrandShowcase({ brands, loading = false }: BrandShowcaseProps) {
  const activeBrands = brands.filter((b) => b.name?.trim());
  if (!loading && activeBrands.length === 0) return null;

  return (
    <section aria-labelledby="brands-heading" className="py-8 md:py-12 bg-background">
      <div className="container-x mx-auto">
        <div className="flex items-end justify-between mb-2">
          <div>
            <h2
              id="brands-heading"
              className="text-[22px] md:text-[26px] font-bold text-foreground tracking-tight leading-none"
            >
              Brands
            </h2>
            <p className="text-[13px] text-foreground-muted mt-1.5 leading-snug">
              Shop your favourite labels.
            </p>
          </div>
          <Link
            href="/brands"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-foreground hover:text-foreground/60 transition-colors whitespace-nowrap pb-0.5"
          >
            View all <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-5">
          {loading ? (
            <BrandGridSkeleton />
          ) : (
            <ul
              role="list"
              className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
            >
              {activeBrands.slice(0, 12).map((brand) => (
                <li key={brand.id}>
                  <BrandCard brand={brand} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Brand card ────────────────────────────────────────────────────────────────

function BrandCard({ brand }: { brand: StorefrontBrandResponse }) {
  return (
    <Link
      href={`/brands/${brand.slug}`}
      className={cn(
        "group flex flex-col rounded-xl overflow-hidden border border-border",
        "hover:border-border-strong hover:shadow-md",
        "transition-all duration-250 focus-visible:outline-2 focus-visible:outline-focus",
      )}
      aria-label={brand.name ?? "Brand"}
    >
      {/* Logo area — square, neutral bg, logo centered with padding */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface flex items-center justify-center">
        {brand.logoUrl ? (
          <Image
            src={brand.logoUrl}
            alt={brand.name ?? "Brand"}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 17vw"
            className="object-contain p-5 transition-transform duration-350 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span
            className="text-3xl font-bold text-border-strong/40 select-none transition-colors group-hover:text-border-strong/60"
            aria-hidden="true"
          >
            {(brand.name ?? "?").charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 bg-background">
        <p className="text-[13px] font-semibold text-foreground truncate leading-snug group-hover:text-foreground/70 transition-colors">
          {brand.name}
        </p>
        {brand.productCount != null && (
          <p className="text-[11px] text-foreground-muted mt-0.5">
            {brand.productCount} products
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function BrandGridSkeleton() {
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
