import { ProductCard } from "@/components/ui/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import type { StorefrontProductSummaryResponse } from "@/types/api";

interface RelatedProductsProps {
  products: StorefrontProductSummaryResponse[];
  currency: string;
  locale: string;
}

/** Renders silently nothing when empty — no empty state shown */
export function RelatedProducts({
  products,
  currency,
  locale,
}: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="py-14 md:py-16 border-t border-border">
      <div className="container-x mx-auto">
        <h2 id="related-heading" className="text-h3 text-foreground mb-8">
          You Might Also Like
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.slice(0, 4).map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              currency={currency}
              locale={locale}
              eager={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function RelatedProductsSkeleton() {
  return (
    <div className="py-14 border-t border-border">
      <div className="container-x mx-auto">
        <div className="h-7 w-52 animate-skeleton bg-muted rounded mb-8" aria-hidden="true" />
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}
