import type { Metadata } from "next";
import { LayoutGrid } from "lucide-react";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CatalogBreadcrumb } from "@/features/catalog/CatalogBreadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryHorizontalCard } from "@/features/storefront/CategoryShowcase";
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

  const settings = safeData(settingsRes, null);
  const policies = safeData(policiesRes, []);
  const categories = safeData(categoriesRes, []);

  return (
    <StorefrontLayout settings={settings} policies={policies}>
      <div className="container-x mx-auto py-6 md:py-10">
        <CatalogBreadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Categories" }]}
          className="mb-5"
        />

        {/* Page header */}
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h1 className="text-[28px] md:text-[36px] font-bold text-foreground tracking-tight leading-none">
              All Categories
            </h1>
            {categories.length > 0 && (
              <p className="text-[13px] text-foreground-muted mt-1.5">
                {categories.length} categories
              </p>
            )}
          </div>
        </div>

        {categories.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid className="size-8" />}
            title="No categories yet"
            description="Categories will appear here once added."
          />
        ) : (
          <ul
            role="list"
            className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {categories.map((cat) => (
              <li key={cat.id}>
                <CategoryHorizontalCard category={cat} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </StorefrontLayout>
  );
}
