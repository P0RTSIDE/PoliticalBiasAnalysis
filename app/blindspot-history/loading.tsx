import { HeatmapSkeleton, Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Skeleton className="h-3 w-48" />
      <Skeleton className="mt-3 h-10 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
      <div className="my-8 h-px bg-hairline" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>
      <div className="mt-8 border border-hairline bg-surface p-6">
        <HeatmapSkeleton />
      </div>
    </div>
  );
}
