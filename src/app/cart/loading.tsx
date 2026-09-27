import { Skeleton } from "@/components/ui/Skeleton";

export default function CartLoading() {
  return (
    <div aria-hidden="true" className="container-x mx-auto py-8 md:py-12">
      <Skeleton className="h-8 w-36 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-5 border-b border-border">
              <Skeleton className="h-24 w-24 rounded-lg shrink-0" />
              <div className="flex-1 flex flex-col gap-2.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
                <div className="flex justify-between items-center mt-auto">
                  <Skeleton className="h-8 w-28 rounded-md" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
