import type { Metadata } from "next";
import { LayoutGrid } from "lucide-react";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CatalogBreadcrumb } from "@/features/catalog/CatalogBreadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryImageCard } from "@/features/storefront/CategoryShowcase";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const r = await storeApi.getSettings();
  const name = r.ok ? (r.data.businessName ?? "Store") : "Store";
  return {
    title: `All Categories — ${name}`,
    description: "Browse all product categories.",
  };
}

export default async function CategoriesPage() {
  const [settingsRes, policiesRes, categoriesRes] = await Promise.allSettled([
    storeApi.getSettings(),
    storeApi.getPolicies(),
    storeApi.getCategories(),
  ]);

  const settings   = safeData(settingsRes, null);
  const policies   = safeData(policiesRes, []);
  const categories = safeData(categoriesRes, []);

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      {/* ── Architectural page header — matches design reference ─────── */}
      <section className="w-full bg-[#f8f9fb] py-8 border-b border-[#e1e2e4]">
        <div className="px-5 md:px-8 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <CatalogBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edeef0] text-[#444748] text-[11px] font-bold tracking-widest uppercase border border-[#e1e2e4]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ba0918]" aria-hidden="true" />
                Archive Index
              </span>
              {categories.length > 0 && (
                <div className="px-3.5 py-1 rounded-full bg-white shadow-sm text-[#191c1e] text-[13px] font-bold border border-[#e1e2e4]">
                  {categories.length} Categories
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#ba0918] mb-2">
                Curated Department Directory
              </p>
              <h1 className="text-[clamp(1.75rem,4vw,3rem)] font-extrabold text-[#191c1e] tracking-tight leading-none">
                All Categories
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category grid ─────────────────────────────────────────────── */}
      <div className="px-5 md:px-8 lg:px-10 py-10">
        {categories.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid className="size-8" />}
            title="No categories yet"
            description="Categories will appear here once added."
          />
        ) : (
          <ul role="list" className="grid gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <li key={cat.id}>
                <CategoryImageCard category={cat} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </StorefrontLayout>
  );
}
