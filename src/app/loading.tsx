/**
 * Root loading UI — shown while the home page server component fetches data.
 * Mirrors the editorial composition: hero → trust bar → categories → products.
 */
import { Skeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col">
      {/* Hero skeleton */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[16/7] bg-muted animate-skeleton" />

      {/* Trust bar */}
      <div className="border-y border-border py-6">
        <div className="container-x mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2.5 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category showcase */}
      <div className="container-x mx-auto py-14">
        <Skeleton className="h-8 w-56 mb-10" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2.5">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>

      {/* Featured products */}
      <div className="container-x mx-auto py-14">
        <Skeleton className="h-8 w-48 mb-10" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
