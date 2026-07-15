import Link from "next/link";
import historyData from "@/data/blindspot-history.json";
import gapsData from "@/data/coverage-gaps.json";
import type { BlindspotHistory, CoverageGaps } from "@/lib/types";
import { computeChronicBlindspots, formatNumber } from "@/lib/utils";
import { WeeklyDataDisclaimer } from "@/components/WeeklyDataDisclaimer";

const history = historyData as BlindspotHistory;
const gaps = gapsData as CoverageGaps;

function getHeroStat() {
  const chronic = computeChronicBlindspots(history, history.weeks);
  // Pick the topic with the highest single-side blindspot count.
  let best = chronic[0];
  let bestSideCount = 0;
  let bestSide: "right" | "left" = "right";

  for (const c of chronic) {
    const series = history.topics[c.topic];
    let right = 0;
    let left = 0;
    for (const w of history.weeks) {
      if (series[w] === "right-blindspot") right += 1;
      if (series[w] === "left-blindspot") left += 1;
    }
    if (right > bestSideCount) {
      bestSideCount = right;
      bestSide = "right";
      best = c;
    }
    if (left > bestSideCount) {
      bestSideCount = left;
      bestSide = "left";
      best = c;
    }
  }

  return {
    topic: best.topic,
    side: bestSide,
    count: bestSideCount,
    total: history.weeks.length,
  };
}

export default function HomePage() {
  const hero = getHeroStat();
  const sideWord = hero.side === "right" ? "right-side" : "left-side";
  const sideColor = hero.side === "right" ? "#EF4444" : "#3B82F6";

  const topGap = [...gaps.categories].sort(
    (a, b) => b.divergenceScore - a.divergenceScore
  )[0];
  const totalStories = gaps.categories.reduce((s, c) => s + c.totalVolume, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <p className="font-mono text-xs uppercase tracking-widest text-highlight">
          Blindspot Tracker
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-[1.1] text-text-primary sm:text-6xl">
          {hero.topic} has been a{" "}
          <span style={{ color: sideColor }}>{sideWord} blindspot</span>{" "}
          <span className="font-mono">{hero.count}</span> of the last{" "}
          <span className="font-mono">{hero.total}</span> weeks.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-text-secondary">
          A media-analysis tool that tracks how often news topics fall into
          political blindspots over time, and quantifies the partisan coverage
          gaps between left- and right-leaning outlets.
        </p>

        <WeeklyDataDisclaimer className="mt-6 max-w-2xl" />

        {/* Quick stats strip */}
        <div className="mt-10 grid grid-cols-2 gap-px border border-hairline bg-hairline sm:grid-cols-4">
          {[
            { label: "Topics tracked", value: Object.keys(history.topics).length },
            { label: "Weeks of history", value: history.weeks.length },
            { label: "Categories studied", value: gaps.categories.length },
            { label: "Stories analyzed", value: formatNumber(totalStories) },
          ].map((stat) => (
            <div key={stat.label} className="bg-background px-4 py-5">
              <div className="font-mono text-2xl font-bold text-text-primary">
                {stat.value}
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-text-secondary">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-hairline" />

      {/* Tool cards */}
      <section className="py-14">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-secondary">
          Two ways to explore the data
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/blindspot-history"
            className="group flex flex-col border border-hairline bg-surface p-7 transition-colors hover:border-highlight"
          >
            <div className="mb-5 grid w-fit grid-cols-5 gap-1">
              {Array.from({ length: 15 }).map((_, i) => {
                const palette = ["#EF4444", "#3B82F6", "#6B7280"];
                return (
                  <span
                    key={i}
                    className="h-3 w-3"
                    style={{ backgroundColor: palette[(i * 7) % 3] }}
                  />
                );
              })}
            </div>
            <h3 className="font-display text-2xl font-bold text-text-primary">
              Blindspot History Analyzer
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
              A longitudinal heatmap of which topics fell into a blindspot each
              week, plus a ranking of the most chronic offenders. Filter by
              topic and time range, and click any cell to read sample coverage.
            </p>
            <span className="mt-5 font-mono text-xs uppercase tracking-widest text-highlight group-hover:underline">
              Open analyzer →
            </span>
          </Link>

          <Link
            href="/coverage-gap"
            className="group flex flex-col border border-hairline bg-surface p-7 transition-colors hover:border-highlight"
          >
            <div className="mb-5 flex w-fit items-end gap-1">
              {[40, 64, 28, 52, 72, 36].map((h, i) => (
                <span
                  key={i}
                  className="w-3"
                  style={{
                    height: h / 3,
                    backgroundColor: i % 2 ? "#3B82F6" : "#EF4444",
                  }}
                />
              ))}
            </div>
            <h3 className="font-display text-2xl font-bold text-text-primary">
              Coverage Gap Study
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
              The research view. Quantify which story categories show the most
              partisan divergence, see how volume and polarization interact, and
              read auto-generated findings, such as {topGap.name} topping the gap
              ranking at a score of {topGap.divergenceScore}.
            </p>
            <span className="mt-5 font-mono text-xs uppercase tracking-widest text-highlight group-hover:underline">
              Open study →
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
