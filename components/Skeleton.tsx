import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse bg-hairline/60", className)}
      aria-hidden="true"
    />
  );
}

/** Skeleton placeholder shaped like the heatmap grid. */
export function HeatmapSkeleton({
  rows = 8,
  cols = 20,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-1" aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-1"
          style={{
            gridTemplateColumns: `7rem repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          <Skeleton className="h-4 w-24 justify-self-end" />
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="aspect-square w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Generic block skeleton for charts. */
export function ChartSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-80 w-full", className)} />;
}
