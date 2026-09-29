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
      <div className="container-x mx-auto py-8 md:py-12 min-h-[60vh]">
        <CatalogBreadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Brands" }]}
          className="mb-6"
        />
        <h1 className="text-h2 text-foreground mb-8">All Brands</h1>

        {brands.length === 0 ? (
          <EmptyState
            icon={<Tag className="size-8" />}
            title="No brands yet"
            description="Brands will appear here once added."
          />
        ) : (
          <ul
            role="list"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
          >
            {brands.map((brand) => (
              <li key={brand.id}>
                <Link
                  href={`/brands/${brand.slug}`}
                  className={cn(
                    "group flex flex-col items-center gap-3 p-4 rounded-lg",
                    "border border-border hover:border-border-strong",
                    "transition-colors duration-150",
                    "focus-visible:outline-2 focus-visible:outline-focus",
                  )}
                >
                  <div className="relative h-14 w-full flex items-center justify-center">
                    {brand.logoUrl ? (
                      <Image
                        src={brand.logoUrl}
                        alt={brand.name ?? "Brand"}
                        fill
                        sizes="200px"
                        className="object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-h3 font-bold text-foreground-muted group-hover:text-foreground transition-colors">
                        {(brand.name ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-body-sm font-medium text-foreground group-hover:text-foreground/70 transition-colors">
                      {brand.name}
                    </p>
                    {brand.productCount != null && (
                      <p className="text-caption text-foreground-muted mt-0.5">
                        {brand.productCount} product{brand.productCount !== 1 ? "s" : ""}
                      </p>
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
