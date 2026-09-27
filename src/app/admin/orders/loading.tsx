import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminOrdersLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <Skeleton className="h-8 w-28" />
      <div className="flex gap-3 flex-wrap">
        <Skeleton className="h-9 w-52 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-border bg-surface">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 w-full max-w-[80px]" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 px-4 py-3.5 border-b border-border last:border-none items-center">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3.5 w-8" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
