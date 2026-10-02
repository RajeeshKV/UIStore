import { Skeleton } from "@/components/ui/Skeleton";

export default function WishlistLoading() {
  return (
    <div className="px-5 md:px-8 lg:px-10 py-8 md:py-12" aria-hidden="true">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="hidden lg:flex flex-col gap-2 w-56 shrink-0">
          <Skeleton className="h-16 w-full rounded-2xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <Skeleton className="h-7 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 rounded-2xl border border-[#e1e2e4] p-4">
                <Skeleton className="h-24 w-24 rounded-xl shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-8 w-28 mt-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
