import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: boolean;
  circle?: boolean;
}

/** Base skeleton block — animate-skeleton is defined in globals.css */
export function Skeleton({ rounded = false, circle = false, className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-skeleton bg-surface-container",
        circle ? "rounded-full" : rounded ? "rounded-full" : "rounded-lg",
        className,
      )}
      {...props}
    />
  );
}

// ── Compound skeletons ────────────────────────────────────────────────────────

/** Product card skeleton — vertical layout */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}

/** Product grid skeleton */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid-product-cards">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Category card skeleton */
export function CategoryCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-center gap-0 rounded-2xl overflow-hidden border border-border bg-surface-elevated">
      <Skeleton className="shrink-0 w-[90px] h-[90px] rounded-none" />
      <div className="flex-1 px-4 py-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** Admin table row skeleton */
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

/** Page hero skeleton */
export function HeroSkeleton() {
  return (
    <div aria-hidden="true" className="w-full" style={{ height: "clamp(200px, 28vh, 320px)" }}>
      <Skeleton className="w-full h-full rounded-2xl" />
    </div>
  );
}

/** Generic text block skeleton */
export function TextBlockSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: i === lines - 1 ? "60%" : "100%" }} />
      ))}
    </div>
  );
}

/** Product detail page skeleton */
export function ProductDetailSkeleton() {
  return (
    <div aria-hidden="true" className="container-x mx-auto py-8">
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="flex flex-col gap-3">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-16 rounded-xl shrink-0" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-3/4" />
          <div className="flex gap-3 mt-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-5 w-20 mt-1.5" />
          </div>
          <Skeleton className="h-4 w-20 mt-1" />
          <div className="flex flex-col gap-2 mt-2">
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-16 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-3">
            <Skeleton className="h-12 flex-1 rounded-lg" />
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
          <Skeleton className="h-14 w-full rounded-xl mt-2" />
        </div>
      </div>
    </div>
  );
}
