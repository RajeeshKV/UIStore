"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { StorefrontBrandResponse } from "@/types/api";

interface BrandShowcaseProps {
  brands: StorefrontBrandResponse[];
  loading?: boolean;
}

export function BrandShowcase({ brands, loading = false }: BrandShowcaseProps) {
  const shouldReduce = useReducedMotion();
  const activeBrands = brands.filter((b) => b.name?.trim());
  if (!loading && activeBrands.length === 0) return null;

  return (
    <section
      aria-labelledby="brands-heading"
      className="py-8 md:py-12 bg-[#f8f9fb] border-t border-[#e1e2e4]"
    >
      <div className="px-5 md:px-8 lg:px-10">
        {/* Section header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#ba0918] mb-1.5">
              Shop by
            </p>
            <h2
              id="brands-heading"
              className="text-[22px] font-bold tracking-tight text-[#191c1e]"
            >
              Brands
            </h2>
          </div>
          <Link
            href="/brands"
            className="group inline-flex items-center gap-1 text-[13px] font-bold text-[#191c1e] hover:text-[#ba0918] transition-colors whitespace-nowrap"
          >
            View All
            <ArrowRight className="size-[16px] group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <BrandGridSkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {activeBrands.slice(0, 8).map((brand, i) => (
              <motion.div
                key={brand.id}
                initial={shouldReduce ? undefined : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <BrandImageCard brand={brand} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * BrandImageCard — same visual pattern as CategoryImageCard:
 * h-56 rounded-2xl, full-cover image/logo, gradient overlay,
 * brand name + product count at bottom, arrow circle bottom-right.
 */
export function BrandImageCard({ brand }: { brand: StorefrontBrandResponse }) {
  return (
    <Link
      href={`/brands/${brand.slug}`}
      className={cn(
        "group relative flex flex-col justify-between h-56 rounded-2xl overflow-hidden",
        "bg-[#edeef0] border border-[#e1e2e4]/40",
        "shadow-sm hover:shadow-xl transition-all duration-300",
        "focus-visible:outline-2 focus-visible:outline-[#0D0D0D]",
      )}
      aria-label={`${brand.name}${brand.productCount != null ? ` — ${brand.productCount} products` : ""}`}
    >
      {/* Full-cover background: brand image if available, else neutral with initial */}
      {brand.logoUrl ? (
        <Image
          src={brand.logoUrl}
          alt={brand.name ?? "Brand"}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        /* No image: use a clean neutral gradient with the brand initial */
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8f9fb] to-[#edeef0] flex items-center justify-center">
          <span className="text-[5rem] font-black text-[#0D0D0D]/8 select-none leading-none" aria-hidden="true">
            {(brand.name ?? "?").charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Gradient overlay — bottom-up */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#191c1e] via-[#191c1e]/40 to-transparent"
        aria-hidden="true"
      />

      {/* Product count badge — top right */}
      {brand.productCount != null && (
        <div className="relative z-10 p-3.5 flex justify-end">
          <span className="px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-md border border-white/60 text-[11px] font-bold text-[#191c1e] tracking-wider uppercase shadow-sm">
            {brand.productCount} products
          </span>
        </div>
      )}

      {brand.productCount == null && <div className="flex-1" />}

      {/* Bottom content */}
      <div className="relative z-10 p-4 flex items-end justify-between">
        <div>
          <h3 className="text-[16px] font-bold text-white leading-snug">
            {brand.name}
          </h3>
          <span className="text-[11px] text-white/70 font-medium">Shop collection</span>
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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function BrandGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} aria-hidden="true" className="h-56 w-full rounded-2xl" />
      ))}
    </div>
  );
}
