import Link from "next/link";
import { cn, dataSource, isLiveData, trackedWeekCount } from "@/lib/utils";
import historyData from "@/data/blindspot-history.json";
import type { BlindspotHistory } from "@/lib/types";

const history = historyData as BlindspotHistory;

type WeeklyDataDisclaimerProps = {
  className?: string;
  /** Coverage pages vs the article analyzer, which does not use weekly snapshots. */
  scope?: "coverage" | "analyze";
};

export function WeeklyDataDisclaimer({
  className,
  scope = "coverage",
}: WeeklyDataDisclaimerProps) {
  const tracked = trackedWeekCount(history);
  const fetched = dataSource.fetchedAt
    ? new Date(dataSource.fetchedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  if (scope === "analyze") {
    return (
      <div
        className={cn(
          "border border-hairline bg-surface/50 px-4 py-3 text-sm leading-relaxed text-text-secondary",
          className
        )}
        role="note"
      >
        <p>
          <span className="font-medium text-text-primary">Data note:</span> This
          tool analyzes a single article and does not use the weekly coverage
          dataset.{" "}
          {isLiveData ? (
            <>
              Coverage charts on other pages show{" "}
              <span className="font-medium text-text-primary">
                {tracked} tracked week{tracked === 1 ? "" : "s"}
              </span>{" "}
              of live measurements.
            </>
          ) : (
            <>Coverage charts elsewhere use sample data for demonstration.</>
          )}{" "}
          <Link href="/about" className="text-highlight hover:underline">
            Methodology
          </Link>
          .
        </p>
      </div>
    );
  }

  if (!isLiveData) {
    return (
      <div
        className={cn(
          "border border-hairline bg-surface/50 px-4 py-3 text-sm leading-relaxed text-text-secondary",
          className
        )}
        role="note"
      >
        <p>
          <span className="font-medium text-text-primary">Data note:</span>{" "}
          Charts on this page use sample data for layout demonstration.{" "}
          <Link href="/about" className="text-highlight hover:underline">
            Read the methodology
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border border-hairline bg-surface/50 px-4 py-3 text-sm leading-relaxed text-text-secondary",
        className
      )}
      role="note"
    >
      <p>
        <span className="font-medium text-text-primary">Data note:</span>{" "}
        Coverage is collected weekly. Charts show{" "}
        <span className="font-medium text-text-primary">
          {tracked} tracked week{tracked === 1 ? "" : "s"}
        </span>{" "}
        with real measurements. New weeks appear as snapshots are added.
        {fetched ? <> Last updated {fetched}.</> : null}{" "}
        <Link href="/about" className="text-highlight hover:underline">
          Read the methodology
        </Link>
        .
      </p>
    </div>
  );
}
