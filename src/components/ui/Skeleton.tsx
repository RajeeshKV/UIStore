import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rounded pill shape */
  rounded?: boolean;
  /** Make it circular */
  circle?: boolean;
}

/** Base skeleton block — animate-skeleton is defined in globals.css */
export function Skeleton({
  rounded = false,
  circle = false,
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-skeleton bg-muted",
        circle ? "rounded-full" : rounded ? "rounded-full" : "rounded-md",
        className,
      )}
      {...props}
    />
  );
}

// ── Compound skeletons that mirror final layout shapes ─────────────────────────

/** Skeleton for a product card */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      {/* Image */}
      <Skeleton className="aspect-square w-full rounded-lg" />
      {/* Category label */}
      <Skeleton className="h-3 w-20" />
      {/* Title */}
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      {/* Price */}
      <Skeleton className="h-5 w-24" />
      {/* Button */}
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

/** Skeleton for a product grid */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Skeleton for a category card */
export function CategoryCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <Skeleton className="h-4 w-32 mx-auto" />
      <Skeleton className="h-3 w-20 mx-auto" />
    </div>
  );
}

/** Skeleton for admin table row */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

/** Skeleton for a page hero */
export function HeroSkeleton() {
  return (
    <div aria-hidden="true" className="relative w-full aspect-[16/7] md:aspect-[16/6]">
      <Skeleton className="absolute inset-0 rounded-none" />
    </div>
  );
}

/** Generic text block skeleton */
export function TextBlockSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

/** Skeleton for the full product detail page */
export function ProductDetailSkeleton() {
  return (
    <div aria-hidden="true" className="container-x mx-auto py-8">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-28" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-16 rounded-lg shrink-0" />
            ))}
          </div>
        </div>

        {/* Info panel */}
        <div className="flex flex-col gap-4 pt-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-3 mt-1">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-5 w-20 mt-1" />
          </div>
          <Skeleton className="h-4 w-20 mt-1" />
          {/* Variants */}
          <div className="flex flex-col gap-2 mt-2">
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-16 rounded-md" />
              ))}
            </div>
          </div>
          {/* CTA */}
          <div className="flex gap-3 mt-3">
            <Skeleton className="h-12 flex-1 rounded-md" />
            <Skeleton className="h-12 w-12 rounded-md" />
          </div>
          {/* Delivery */}
          <Skeleton className="h-12 w-full rounded-lg mt-2" />
          {/* Description lines */}
          <div className="flex flex-col gap-2 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4" style={{ width: i === 3 ? "60%" : "100%" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
