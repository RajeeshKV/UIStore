import { Skeleton } from "@/components/ui/Skeleton";

export default function BrandsLoading() {
  return (
    <div aria-hidden="true" className="container-x mx-auto py-10">
      <Skeleton className="h-8 w-36 mb-3" />
      <Skeleton className="h-4 w-72 mb-10" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
