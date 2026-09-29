"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { StorefrontBrandResponse } from "@/types/api";

interface BrandShowcaseProps {
  brands: StorefrontBrandResponse[];
}

/**
 * Renders only when there are active brands with content.
 * Completely hidden when brands array is empty.
 */
export function BrandShowcase({ brands }: BrandShowcaseProps) {
  // Only show brands that have a name (active, usable brands)
  const activeBrands = brands.filter((b) => b.name?.trim());
  if (activeBrands.length === 0) return null;

  return (
    <section aria-labelledby="brands-heading" className="py-8 md:py-10 bg-background border-y border-border">
      <div className="container-x mx-auto">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <h2 id="brands-heading" className="text-h4 font-bold text-foreground">Brands</h2>
          <Link href="/brands" className="inline-flex items-center gap-1 text-body-sm text-foreground-muted hover:text-foreground transition-colors">
            View all <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Horizontal scrollable on mobile, grid on desktop */}
        <ul
          role="list"
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-3"
        >
          {activeBrands.slice(0, 16).map((brand) => (
            <li key={brand.id}>
              <BrandCard brand={brand} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BrandCard({ brand }: { brand: StorefrontBrandResponse }) {
  return (
    <Link
      href={`/brands/${brand.slug}`}
      className="group flex flex-col items-center gap-1.5 p-2.5 rounded-md border border-border hover:border-border-strong hover:bg-surface transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-focus"
      aria-label={brand.name ?? "Brand"}
    >
      {/* Logo */}
      <div className="relative h-8 w-full flex items-center justify-center">
        {brand.logoUrl ? (
          <Image
            src={brand.logoUrl}
            alt={brand.name ?? "Brand"}
            fill
            sizes="120px"
            className="object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-body font-bold text-foreground-muted group-hover:text-foreground transition-colors select-none">
            {(brand.name ?? "?").charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <p className="text-[10px] font-medium text-foreground-muted group-hover:text-foreground transition-colors truncate w-full text-center leading-tight">
        {brand.name}
      </p>
    </Link>
  );
}
