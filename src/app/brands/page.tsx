import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CatalogBreadcrumb } from "@/features/catalog/CatalogBreadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { BrandHorizontalCard } from "@/features/storefront/BrandShowcase";
import { safeData } from "@/lib/utils";

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
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h1 className="text-[28px] md:text-[36px] font-bold text-foreground tracking-tight leading-none">
              All Brands
            </h1>
            {brands.length > 0 && (
              <p className="text-[13px] text-foreground-muted mt-1.5">
                {brands.length} brands
              </p>
            )}
          </div>
        </div>

        {brands.length === 0 ? (
          <EmptyState
            icon={<Tag className="size-8" />}
            title="No brands yet"
            description="Brands will appear here once added."
          />
        ) : (
          <ul
            role="list"
            className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {brands.map((brand) => (
              <li key={brand.id}>
                <BrandHorizontalCard brand={brand} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </StorefrontLayout>
  );
}
