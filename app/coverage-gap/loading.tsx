import { ChartSkeleton, Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Skeleton className="h-3 w-48" />
      <Skeleton className="mt-3 h-10 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
      <div className="my-8 h-px bg-hairline" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="mt-12 border border-hairline bg-surface p-6">
        <ChartSkeleton className="h-96" />
      </div>
    </div>
  );
}
