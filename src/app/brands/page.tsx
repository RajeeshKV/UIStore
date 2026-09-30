import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CatalogBreadcrumb } from "@/features/catalog/CatalogBreadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "lucide-react";
import { cn, safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const r = await storeApi.getSettings();
  const name = r.ok ? (r.data.businessName ?? "Kromic Store") : "Kromic Store";
  return { title: `All Brands — ${name}`, description: "Browse all brands available in our store." };
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
      <div className="container-x mx-auto py-6 md:py-8">
        <CatalogBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Brands" }]} className="mb-4" />
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-h3 font-bold text-foreground">All Brands</h1>
            {brands.length > 0 && (
              <p className="text-caption text-foreground-muted mt-0.5">{brands.length} brands</p>
            )}
          </div>
        </div>

        {brands.length === 0 ? (
          <EmptyState icon={<Tag className="size-8" />} title="No brands yet" description="Brands will appear here once added." />
        ) : (
          <ul
            role="list"
            className="grid-catalog-cards"
          >
            {brands.map((brand) => (
              <li key={brand.id}>
                <Link
                  href={`/brands/${brand.slug}`}
                  className={cn(
                    "group flex flex-col items-center gap-3 p-4 rounded-lg",
                    "border border-border hover:border-border-strong hover:shadow-sm hover:bg-surface",
                    "transition-all duration-150 focus-visible:outline-2 focus-visible:outline-focus",
                  )}
                >
                  {/* Logo area — taller to match category image proportion */}
                  <div className="relative h-24 w-full flex items-center justify-center bg-muted/40 rounded-md overflow-hidden">
                    {brand.logoUrl ? (
                      <Image
                        src={brand.logoUrl}
                        alt={brand.name ?? "Brand"}
                        fill
                        sizes="300px"
                        className="object-contain p-3"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-foreground-muted/50 group-hover:text-foreground-muted transition-colors select-none">
                        {(brand.name ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex flex-col items-center gap-0.5 w-full">
                    <p className="text-body-sm font-semibold text-foreground group-hover:text-foreground/70 transition-colors truncate w-full text-center">
                      {brand.name}
                    </p>
                    {brand.productCount != null && (
                      <p className="text-caption text-foreground-muted">{brand.productCount} products</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </StorefrontLayout>
  );
}
