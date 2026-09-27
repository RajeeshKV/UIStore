import { Skeleton } from "@/components/ui/Skeleton";

export default function ShopLoading() {
  return (
    <div aria-hidden="true" className="container-x mx-auto py-6">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-5">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Heading */}
      <Skeleton className="h-8 w-48 mb-4" />

      {/* Toolbar */}
      <div className="flex items-center justify-between py-4 border-b border-border mb-6">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Layout: sidebar + grid */}
      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="hidden lg:flex flex-col gap-4 w-56 shrink-0">
          <Skeleton className="h-5 w-24 mb-2" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3.5" style={{ width: `${50 + i * 10}px` }} />
            </div>
          ))}
          <Skeleton className="h-5 w-16 mt-4 mb-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3.5" style={{ width: `${45 + i * 12}px` }} />
            </div>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
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
