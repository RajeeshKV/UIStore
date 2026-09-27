import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountLoading() {
  return (
    <div aria-hidden="true" className="container-x mx-auto py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Sidebar */}
        <div className="hidden lg:flex flex-col gap-2 w-52 shrink-0">
          <div className="px-3 pb-4 mb-2 border-b border-border">
            <Skeleton className="h-4 w-32 mb-1.5" />
            <Skeleton className="h-3 w-40" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
        {/* Mobile nav tabs */}
        <div className="lg:hidden flex gap-2 w-full overflow-x-auto pb-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md shrink-0" />
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <Skeleton className="h-7 w-40 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl mt-6" />
        </div>
      </div>
    </div>
  );
}
