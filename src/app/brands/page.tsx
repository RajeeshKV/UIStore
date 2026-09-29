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
      <div className="container-x mx-auto py-6 md:py-8 min-h-[60vh]">
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
          <ul role="list" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
            {brands.map((brand) => (
              <li key={brand.id}>
                <Link
                  href={`/brands/${brand.slug}`}
                  className={cn(
                    "group flex flex-col items-center gap-2 p-3 rounded-lg",
                    "border border-border hover:border-border-strong hover:bg-surface",
                    "transition-all duration-150 focus-visible:outline-2 focus-visible:outline-focus",
                  )}
                >
                  {/* Logo */}
                  <div className="relative h-10 w-full flex items-center justify-center">
                    {brand.logoUrl ? (
                      <Image
                        src={brand.logoUrl}
                        alt={brand.name ?? "Brand"}
                        fill
                        sizes="150px"
                        className="object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-h4 font-bold text-foreground-muted group-hover:text-foreground transition-colors select-none">
                        {(brand.name ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-foreground-muted group-hover:text-foreground transition-colors truncate w-full text-center">
                    {brand.name}
                  </p>
                  {brand.productCount != null && (
                    <p className="text-[10px] text-foreground-muted">{brand.productCount} products</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </StorefrontLayout>
  );
}
