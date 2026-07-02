import sourceData from "@/data/source.json";
import type { DataSource } from "@/lib/types";
import { cn } from "@/lib/utils";

const source = sourceData as DataSource;

/**
 * Small, honest provenance badge shown on data pages. Reads data/source.json,
 * which the data scripts write: "mock" (seeded generator) or a "live-*" mode
 * (real coverage — GDELT full history, or NewsData.io accumulating snapshots).
 */
export function DataSourceBadge({ className }: { className?: string }) {
  const isLive = source.mode.startsWith("live");
  const label = isLive ? "Live data" : "Illustrative mock data";
  const dot = isLive ? "bg-left-blindspot" : "bg-highlight";

  const fetched =
    isLive && source.fetchedAt
      ? ` · fetched ${new Date(source.fetchedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}`
      : "";

  const collected =
    isLive && typeof source.weeksCollected === "number"
      ? ` · ${source.weeksCollected} real week${
          source.weeksCollected === 1 ? "" : "s"
        } collected`
      : "";

  const detail = isLive
    ? `${source.provider} · ${source.biasSource} · ${source.outletCount} outlets${collected}${fetched}`
    : "Seeded illustrative data · run npm run fetch-data (GDELT) or npm run fetch-newsdata for live coverage";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 border border-hairline bg-surface px-3 py-1.5",
        className
      )}
      title={detail}
    >
      <span className={cn("h-2 w-2", dot)} aria-hidden="true" />
      <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
        {label}
      </span>
      <span className="hidden text-[11px] text-text-secondary/70 sm:inline">
        {isLive
          ? `${source.provider} · ${source.biasSource}${collected}`
          : "run npm run fetch-newsdata for live coverage"}
      </span>
    </div>
  );
}
