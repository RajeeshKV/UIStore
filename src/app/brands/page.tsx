import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CatalogBreadcrumb } from "@/features/catalog/CatalogBreadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { BrandImageCard } from "@/features/storefront/BrandShowcase";
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
  const brands   = safeData(brandsRes, []);

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      {/* ── Architectural page header ───────────────────────────────── */}
      <section className="w-full bg-[#f8f9fb] py-8 border-b border-[#e1e2e4]">
        <div className="px-5 md:px-8 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <CatalogBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Brands" }]} />
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edeef0] text-[#444748] text-[11px] font-bold tracking-widest uppercase border border-[#e1e2e4]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ba0918]" aria-hidden="true" />
                Brand Index
              </span>
              {brands.length > 0 && (
                <div className="px-3.5 py-1 rounded-full bg-white shadow-sm text-[#191c1e] text-[13px] font-bold border border-[#e1e2e4]">
                  {brands.length} Brands
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#ba0918] mb-2">
              Premium Manufacturers
            </p>
            <h1 className="text-[clamp(1.75rem,4vw,3rem)] font-extrabold text-[#191c1e] tracking-tight leading-none">
              All Brands
            </h1>
          </div>
        </div>
      </section>

      {/* ── Brands grid ─────────────────────────────────────────────── */}
      <div className="px-5 md:px-8 lg:px-10 py-10">
        {brands.length === 0 ? (
          <EmptyState
            icon={<Tag className="size-8" />}
            title="No brands yet"
            description="Brands will appear here once added."
          />
        ) : (
          <ul role="list" className="grid gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            {brands.map((brand) => (
              <li key={brand.id}>
                <BrandImageCard brand={brand} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </StorefrontLayout>
  );
}
