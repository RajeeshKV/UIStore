import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminProductsLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <Skeleton className="h-9 w-64 rounded-md" />
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-border bg-surface">
          {["Product", "Price", "Category", "Status", ""].map((h) => (
            <Skeleton key={h} className="h-3.5 w-full max-w-[80px]" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 px-4 py-3.5 border-b border-border last:border-none items-center">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded shrink-0" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-7 w-7 rounded-md ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
