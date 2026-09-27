import { Skeleton } from "@/components/ui/Skeleton";

export default function AddressesLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-3.5 w-56" />
          <Skeleton className="h-3.5 w-40" />
        </div>
      ))}
    </div>
  );
}
