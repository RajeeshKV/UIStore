import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CatalogBreadcrumb } from "@/features/catalog/CatalogBreadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayoutGrid } from "lucide-react";
import { safeData } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const r = await storeApi.getSettings();
  const name = r.ok ? (r.data.businessName ?? "Kromic Store") : "Kromic Store";
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
      <div className="container-x mx-auto py-8 md:py-12 min-h-[60vh]">
        <CatalogBreadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Categories" }]}
          className="mb-6"
        />
        <h1 className="text-h2 text-foreground mb-8">All Categories</h1>

        {categories.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid className="size-8" />}
            title="No categories yet"
            description="Categories will appear here once added."
          />
        ) : (
          <ul
            role="list"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
          >
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className="group flex flex-col items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-focus rounded-lg"
                >
                  <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-surface">
                    {cat.imageUrl ? (
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name ?? "Category"}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-surface">
                        <span className="text-display font-bold text-border-strong/60 select-none">
                          {(cat.name ?? "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-body-sm font-medium text-foreground group-hover:text-foreground/70 transition-colors">
                      {cat.name}
                    </p>
                    {cat.productCount != null && (
                      <p className="text-caption text-foreground-muted mt-0.5">
                        {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
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
