import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CatalogBreadcrumb } from "@/features/catalog/CatalogBreadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayoutGrid } from "lucide-react";
import { safeData, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const r = await storeApi.getSettings();
  const name = r.ok ? (r.data.businessName ?? "Kromic Store") : "Kromic Store";
  return { title: `All Categories — ${name}`, description: "Browse all product categories." };
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
      <div className="container-x mx-auto py-6 md:py-8">
        <CatalogBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Categories" }]} className="mb-4" />
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-h3 font-bold text-foreground">All Categories</h1>
            {categories.length > 0 && (
              <p className="text-caption text-foreground-muted mt-0.5">{categories.length} categories</p>
            )}
          </div>
        </div>

        {categories.length === 0 ? (
          <EmptyState icon={<LayoutGrid className="size-8" />} title="No categories yet" description="Categories will appear here once added." />
        ) : (
          <ul
            role="list"
            className="grid-catalog-cards"
          >
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className={cn(
                    "group flex flex-col gap-2 rounded-lg overflow-hidden border border-border",
                    "hover:border-border-strong hover:shadow-sm transition-all duration-150",
                    "focus-visible:outline-2 focus-visible:outline-focus",
                  )}
                  aria-label={`${cat.name}${cat.productCount ? ` — ${cat.productCount} products` : ""}`}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                    {cat.imageUrl ? (
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name ?? "Category"}
                        fill
                        sizes="300px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <span className="text-h2 font-bold text-border-strong/50 select-none" aria-hidden="true">
                          {(cat.name ?? "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="px-4 pb-4 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-body-sm font-semibold text-foreground truncate group-hover:text-foreground/70 transition-colors">
                        {cat.name}
                      </p>
                      {cat.productCount != null && (
                        <p className="text-caption text-foreground-muted">{cat.productCount} products</p>
                      )}
                    </div>
                    <ArrowRight className="size-4 text-foreground-muted group-hover:text-foreground transition-colors shrink-0 mt-0.5" aria-hidden="true" />
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
