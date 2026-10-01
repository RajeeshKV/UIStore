import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Tag } from "lucide-react";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CatalogBreadcrumb } from "@/features/catalog/CatalogBreadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const r = await storeApi.getSettings();
  const name = r.ok ? (r.data.businessName ?? "Store") : "Store";
  return {
    title: `All Brands — ${name}`,
    description: "Browse all brands available in our store.",
  };
}

export default async function BrandsPage() {
  const [settingsRes, policiesRes, brandsRes] = await Promise.allSettled([
    storeApi.getSettings(),
    storeApi.getPolicies(),
    storeApi.getBrands(),
  ]);

  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);
  const brands = safeData(brandsRes, []);

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <div className="container-x mx-auto py-6 md:py-10">
        <CatalogBreadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Brands" }]}
          className="mb-5"
        />

        {/* Page header */}
        <div className="mb-6 md:mb-8">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-foreground-muted mb-2">
            Discover
          </p>
          <h1 className="text-[32px] md:text-[42px] font-bold text-foreground tracking-tight leading-none">
            All Brands
          </h1>
          <p className="text-[14px] text-foreground-muted mt-3 leading-relaxed">
            Shop your favourite labels and discover new ones.
          </p>
          {brands.length > 0 && (
            <p className="text-[13px] text-foreground-muted/70 mt-2">
              {brands.length} brands
            </p>
          )}
        </div>

        {brands.length === 0 ? (
          <EmptyState
            icon={<Tag className="size-8" />}
            title="No brands yet"
            description="Brands will appear here once added."
          />
        ) : (
          <>
            <ul
              role="list"
              className="grid gap-4 md:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            >
              {brands.map((brand) => (
                <li key={brand.id}>
                  <Link
                    href={`/brands/${brand.slug}`}
                    className={cn(
                      "group flex flex-col rounded-2xl overflow-hidden border border-border",
                      "hover:border-border-strong hover:shadow-lg",
                      "transition-all duration-300 focus-visible:outline-2 focus-visible:outline-focus",
                    )}
                    aria-label={`${brand.name}${brand.productCount != null ? ` — ${brand.productCount} products` : ""}`}
                  >
                    {/* Logo area — neutral bg, centered with generous padding */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface flex items-center justify-center">
                      {brand.logoUrl ? (
                        <Image
                          src={brand.logoUrl}
                          alt={brand.name ?? "Brand"}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 300px"
                          className="object-contain p-8 transition-transform duration-500 group-hover:scale-[1.06]"
                          loading="lazy"
                        />
                      ) : (
                        <span
                          className="text-5xl font-bold text-border-strong/30 select-none"
                          aria-hidden="true"
                        >
                          {(brand.name ?? "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info row */}
                    <div className="flex items-center justify-between gap-3 px-4 py-4 bg-background">
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-foreground truncate leading-snug tracking-tight">
                          {brand.name}
                        </p>
                        {brand.productCount != null && (
                          <p className="text-[12px] text-foreground-muted mt-0.5">
                            {brand.productCount} products
                          </p>
                        )}
                      </div>

                      {/* Arrow pill */}
                      <div
                        className={cn(
                          "shrink-0 w-9 h-9 rounded-full border border-border",
                          "flex items-center justify-center",
                          "group-hover:bg-foreground group-hover:border-foreground group-hover:text-background group-hover:translate-x-0.5",
                          "transition-all duration-250",
                        )}
                        aria-hidden="true"
                      >
                        <ArrowRight className="size-4" />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Bottom CTA */}
            <div className="mt-8 rounded-2xl bg-surface border border-border px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[14px] font-semibold text-foreground">
                  Can&apos;t find your brand?
                </p>
                <p className="text-[12px] text-foreground-muted mt-1">
                  Browse our complete collection to discover all available products.
                </p>
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-foreground hover:text-foreground/60 transition-colors whitespace-nowrap"
              >
                Browse all products <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </>
        )}
      </div>
    </StorefrontLayout>
  );
}
