import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { StorefrontLayout } from "@/components/layout";
import { storeApi } from "@/services/api/store";
import { CatalogBreadcrumb } from "@/features/catalog/CatalogBreadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { safeData, cn } from "@/lib/utils";

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
        <div className="mb-6 md:mb-8">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-foreground-muted mb-2">
            Discover
          </p>
          <h1 className="text-[32px] md:text-[42px] font-bold text-foreground tracking-tight leading-none">
            Explore Categories
          </h1>
          <p className="text-[14px] text-foreground-muted mt-3 leading-relaxed">
            Find what you&apos;re looking for and discover products you&apos;ll love.
          </p>
          {categories.length > 0 && (
            <p className="text-[13px] text-foreground-muted/70 mt-2">
              {categories.length} categories
            </p>
          )}
        </div>

        {categories.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid className="size-8" />}
            title="No categories yet"
            description="Categories will appear here once added."
          />
        ) : (
          <>
            <ul
              role="list"
              className="grid gap-4 md:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            >
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className={cn(
                      "group flex flex-col rounded-2xl overflow-hidden border border-border",
                      "hover:border-border-strong hover:shadow-lg",
                      "transition-all duration-300 focus-visible:outline-2 focus-visible:outline-focus",
                    )}
                    aria-label={`${cat.name}${cat.productCount != null ? ` — ${cat.productCount} products` : ""}`}
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                      {cat.imageUrl ? (
                        <Image
                          src={cat.imageUrl}
                          alt={cat.name ?? "Category"}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 300px"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                          <span
                            className="text-5xl font-bold text-border-strong/30 select-none"
                            aria-hidden="true"
                          >
                            {(cat.name ?? "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info row */}
                    <div className="flex items-center justify-between gap-3 px-4 py-4 bg-background">
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-foreground truncate leading-snug tracking-tight">
                          {cat.name}
                        </p>
                        {cat.productCount != null && (
                          <p className="text-[12px] text-foreground-muted mt-0.5">
                            {cat.productCount} products
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
                  Looking for something specific?
                </p>
                <p className="text-[12px] text-foreground-muted mt-1">
                  Browse our complete product collection and find your next favourite.
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
