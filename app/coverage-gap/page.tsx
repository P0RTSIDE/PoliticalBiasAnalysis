"use client";

import { useMemo, useState } from "react";
import gapsData from "@/data/coverage-gaps.json";
import type { CoverageGaps } from "@/lib/types";
import { coverageRatio, formatNumber, isLiveData } from "@/lib/utils";
import { CoverageBarChart } from "@/components/CoverageBarChart";
import { ScatterPlot } from "@/components/ScatterPlot";
import { InsightCallout } from "@/components/InsightCallout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { WeeklyDataDisclaimer } from "@/components/WeeklyDataDisclaimer";

const gaps = gapsData as CoverageGaps;

function buildInsights(data: CoverageGaps) {
  const byDivergence = [...data.categories].sort(
    (a, b) => b.divergenceScore - a.divergenceScore
  );
  const insights = byDivergence.slice(0, 4).map((c) => {
    const { factor, side } = coverageRatio(c);
    const accent = side === "left" ? "left" : "right";
    return {
      eyebrow: c.name,
      metric: `${factor}x`,
      statement: `${c.name} stories are covered ${factor}x more by ${
        side === "left" ? "left-leaning" : "right-leaning"
      } outlets.`,
      detail: `Left ${c.leftCoverage}% vs right ${c.rightCoverage}% of measured coverage across ${formatNumber(
        c.totalVolume
      )} stories.`,
      accent: accent as "left" | "right",
    };
  });
  return insights;
}

export default function CoverageGapPage() {
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const insights = useMemo(() => buildInsights(gaps), []);

  const mostPolarized = [...gaps.categories].sort(
    (a, b) => b.divergenceScore - a.divergenceScore
  )[0];
  const highestVolume = [...gaps.categories].sort(
    (a, b) => b.totalVolume - a.totalVolume
  )[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <p className="font-mono text-xs uppercase tracking-widest text-highlight">
            Coverage Gap Study
          </p>
          <DataSourceBadge />
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          Quantifying partisan coverage gaps by category
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Some story categories are reported on evenly across the spectrum.
          Others are carried almost entirely by one side. The divergence score
          measures how lopsided that left/right split is, from 0 (balanced) to
          100 (one side only).
        </p>
        <WeeklyDataDisclaimer className="mt-4" />
      </header>

      <div className="my-8 h-px bg-hairline" />

      {/* Top findings */}
      <section>
        <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-text-secondary">
          Top findings
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {insights.map((insight) => (
            <InsightCallout key={insight.eyebrow} {...insight} />
          ))}
        </div>
      </section>

      {/* Bar chart */}
      <section className="mt-12">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold text-text-primary">
            Divergence by category
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">
            blue = left-led · red = right-led
          </span>
        </div>
        <p className="mb-5 text-sm text-text-secondary">
          Longer bars indicate a more one-sided coverage split. Bar color shows
          which side carried the category.
        </p>
        <div className="border border-hairline bg-surface p-4 sm:p-6">
          <CoverageBarChart categories={gaps.categories} />
        </div>
      </section>

      {/* Scatter plot */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Volume vs. polarization
        </h2>
        <p className="mb-5 mt-1 text-sm text-text-secondary">
          The upper-right quadrant is the danger zone: categories that are both
          high-volume <em>and</em> highly polarized shape the most readers while
          showing the widest coverage gap. Bubble size scales with volume.
        </p>
        <div className="border border-hairline bg-surface p-4 sm:p-6">
          <ScatterPlot categories={gaps.categories} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border border-hairline bg-surface p-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">
              Most polarized category
            </div>
            <div className="mt-1 text-lg font-medium text-text-primary">
              {mostPolarized.name}
            </div>
            <div className="font-mono text-sm text-text-secondary">
              gap score {mostPolarized.divergenceScore}
            </div>
          </div>
          <div className="border border-hairline bg-surface p-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">
              Highest volume category
            </div>
            <div className="mt-1 text-lg font-medium text-text-primary">
              {highestVolume.name}
            </div>
            <div className="font-mono text-sm text-text-secondary">
              {formatNumber(highestVolume.totalVolume)} stories
            </div>
          </div>
        </div>
      </section>

      {/* Methodology accordion */}
      <section className="mt-12">
        <button
          type="button"
          aria-expanded={methodologyOpen}
          onClick={() => setMethodologyOpen((v) => !v)}
          className="flex w-full items-center justify-between border border-hairline bg-surface px-5 py-4 text-left"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-text-primary">
            How the divergence score is calculated
          </span>
          <span className="font-mono text-highlight">
            {methodologyOpen ? "−" : "+"}
          </span>
        </button>
        {methodologyOpen && (
          <div className="animate-fade-in space-y-4 border border-t-0 border-hairline bg-surface px-5 py-5 text-sm leading-relaxed text-text-secondary">
            <p>
              For each story category we measure the share of total coverage
              originating from left-leaning versus right-leaning outlets. An
              outlet&apos;s lean comes from the consensus of three independent
              monitors (AllSides, Ad Fontes Media, and Media Bias Fact Check),
              mapped to a common 5-point scale. Center outlets are tracked
              for volume but excluded from the left/right split.
            </p>
            <div className="border border-hairline bg-background p-4 font-mono text-xs text-text-primary">
              divergence = | leftCoverage% − rightCoverage% |
            </div>
            <p>
              A score of <span className="text-text-primary">0</span> means a
              perfect 50/50 split. A score of{" "}
              <span className="text-text-primary">100</span> means one side
              carried the category entirely. The coverage ratio (e.g.{" "}
              <span className="text-text-primary">3×</span>) expresses the same
              gap as a multiple.
            </p>
            <p>
              <span className="font-medium text-text-primary">Volume</span> is
              the total article count in the category across the measured
              window (left + right + center). Pairing volume with divergence on
              the scatter plot distinguishes a niche, lopsided topic from one
              that is both widely covered and sharply split.
            </p>
            <p>
              <span className="font-medium text-text-primary">
                Weekly trend
              </span>{" "}
              stores the per-week divergence value so you can see whether a
              category&apos;s gap is widening or narrowing over time.
            </p>
            <p>
              <span className="font-medium text-text-primary">
                Partial history
              </span>{" "}
              Category totals and divergence scores aggregate every week that
              has a live snapshot. Weeks without data contribute zero volume
              and appear as flat segments in the weekly trend. Rankings and
              auto-generated findings can shift as more weeks are collected.
            </p>
            <p>
              Live data comes from article-volume counts (GDELT or NewsData.io)
              grouped by outlet domain and topic keyword. See the{" "}
              <a href="/about" className="text-highlight hover:underline">
                full methodology
              </a>{" "}
              for ingestion details, thresholds, and limitations.
            </p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary/70">
              {isLiveData
                ? "Figures reflect live coverage counts. See the badge above for the data source and weeks collected."
                : "Figures show sample data for layout demonstration."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
