import Link from "next/link";
import { cn, dataSource, isLiveData } from "@/lib/utils";

type WeeklyDataDisclaimerProps = {
  className?: string;
  /** Coverage pages vs the article analyzer, which does not use weekly snapshots. */
  scope?: "coverage" | "analyze";
};

export function WeeklyDataDisclaimer({
  className,
  scope = "coverage",
}: WeeklyDataDisclaimerProps) {
  const windowWeeks = dataSource.weeks;
  const collected =
    typeof dataSource.weeksCollected === "number"
      ? dataSource.weeksCollected
      : 0;
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
              Coverage charts on other pages are updated weekly;{" "}
              <span className="font-medium text-text-primary">
                {collected} of {windowWeeks} weeks
              </span>{" "}
              currently have real measurements.
            </>
          ) : (
            <>Coverage charts elsewhere currently show illustrative data.</>
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
          Charts on this page currently show illustrative placeholder data, not
          live weekly measurements. When live data is enabled, coverage is
          collected weekly and history builds one week at a time across a{" "}
          {windowWeeks}-week window.{" "}
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
        Coverage figures are collected weekly (one snapshot per update). Only{" "}
        <span className="font-medium text-text-primary">
          {collected} of {windowWeeks} weeks
        </span>{" "}
        currently have real measurements. The charts still show the full{" "}
        {windowWeeks}-week window; weeks without a snapshot appear empty
        rather than estimated.
        {fetched ? <> Last updated {fetched}.</> : null}{" "}
        <Link href="/about" className="text-highlight hover:underline">
          Read the methodology
        </Link>
        .
      </p>
    </div>
  );
}
