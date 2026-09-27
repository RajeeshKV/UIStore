import { Skeleton } from "@/components/ui/Skeleton";

export default function CheckoutLoading() {
  return (
    <div aria-hidden="true" className="container-x mx-auto py-8 md:py-12 max-w-5xl">
      <Skeleton className="h-8 w-32 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Form */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Skeleton className="h-6 w-40" />
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
            </div>
            <Skeleton className="h-10 rounded-md" />
            <Skeleton className="h-10 rounded-md" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-6 w-36 mt-2" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-md mt-2" />
        </div>
        {/* Summary */}
        <div className="lg:col-span-2">
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
