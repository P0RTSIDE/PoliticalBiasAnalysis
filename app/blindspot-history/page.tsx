"use client";

import { useMemo, useState } from "react";
import historyData from "@/data/blindspot-history.json";
import type { BlindspotHistory } from "@/lib/types";
import {
  STATE_COLORS,
  computeChronicBlindspots,
  isLiveData,
  sliceRecentWeeks,
} from "@/lib/utils";
import { BlindspotHeatmap } from "@/components/BlindspotHeatmap";
import { TopicSelector } from "@/components/TopicSelector";
import {
  TimeRangeToggle,
  type TimeRange,
} from "@/components/TimeRangeToggle";
import {
  SidePanelDrawer,
  type DrawerSelection,
} from "@/components/SidePanelDrawer";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { WeeklyDataDisclaimer } from "@/components/WeeklyDataDisclaimer";

const history = historyData as BlindspotHistory;
const ALL_TOPICS = Object.keys(history.topics);

export default function BlindspotHistoryPage() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(ALL_TOPICS);
  const [range, setRange] = useState<TimeRange>(20);
  const [selection, setSelection] = useState<DrawerSelection | null>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  const weeks = useMemo(
    () => sliceRecentWeeks(history.weeks, range),
    [range]
  );

  const orderedTopics = useMemo(
    () => ALL_TOPICS.filter((t) => selectedTopics.includes(t)),
    [selectedTopics]
  );

  const chronic = useMemo(
    () => computeChronicBlindspots(history, weeks),
    [weeks]
  );

  const visibleChronic = chronic.filter((c) =>
    selectedTopics.includes(c.topic)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <p className="font-mono text-xs uppercase tracking-widest text-highlight">
            Blindspot History Analyzer
          </p>
          <DataSourceBadge />
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          Which topics fall into a blindspot, week by week
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Each cell is one topic in one week. Color shows whether coverage was
          asymmetric (heavily carried by one side of the spectrum) or balanced
          across outlets. Click any cell to inspect sample coverage from that
          week.
        </p>
        <WeeklyDataDisclaimer className="mt-4" />
      </header>

      <div className="my-8 h-px bg-hairline" />

      {/* Controls */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <TopicSelector
            topics={ALL_TOPICS}
            selected={selectedTopics}
            onChange={setSelectedTopics}
          />
        </div>
        <TimeRangeToggle value={range} onChange={setRange} />
      </div>

      {/* Heatmap */}
      <section className="mt-8 border border-hairline bg-surface p-4 sm:p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest text-text-secondary">
            Coverage asymmetry grid
          </h2>
          <span className="font-mono text-[11px] text-text-secondary">
            {orderedTopics.length} topics · {weeks.length} weeks
          </span>
        </div>
        <BlindspotHeatmap
          history={history}
          topics={orderedTopics}
          weeks={weeks}
          onCellClick={setSelection}
        />
      </section>

      {/* Chronic blindspots ranked list */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Most chronic blindspots
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Share of in-coverage weeks each topic spent in a one-sided blindspot,
          and which side carried it.
        </p>

        <div className="mt-6 space-y-3">
          {visibleChronic.length === 0 && (
            <p className="text-sm text-text-secondary">
              Select topics above to see the ranking.
            </p>
          )}
          {visibleChronic.map((c) => {
            const color =
              c.dominantSide === "balanced"
                ? STATE_COLORS.balanced
                : STATE_COLORS[c.dominantSide];
            const sideLabel =
              c.dominantSide === "right-blindspot"
                ? "Right-side"
                : c.dominantSide === "left-blindspot"
                  ? "Left-side"
                  : "Mostly balanced";
            return (
              <div
                key={c.topic}
                className="grid grid-cols-1 items-center gap-3 border border-hairline bg-surface p-4 sm:grid-cols-[10rem_1fr_auto]"
              >
                <div className="text-sm font-medium text-text-primary">
                  {c.topic}
                </div>
                <div>
                  <div className="h-3 w-full bg-background">
                    <div
                      className="h-3 transition-[width] duration-500"
                      style={{
                        width: `${c.blindspotPct}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-text-secondary">
                    <span style={{ color }}>{sideLabel}</span>
                    <span>R {c.rightPct}%</span>
                    <span>L {c.leftPct}%</span>
                    <span>{c.coveredWeeks}/{c.totalWeeks} wks covered</span>
                  </div>
                </div>
                <div
                  className="text-right font-mono text-2xl font-bold"
                  style={{ color }}
                >
                  {c.blindspotPct}%
                </div>
              </div>
            );
          })}
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
            How blindspot states are classified
          </span>
          <span className="font-mono text-highlight">
            {methodologyOpen ? "−" : "+"}
          </span>
        </button>
        {methodologyOpen && (
          <div className="animate-fade-in space-y-4 border border-t-0 border-hairline bg-surface px-5 py-5 text-sm leading-relaxed text-text-secondary">
            <p>
              Each cell is one topic in one ISO week. We count how many articles
              left-leaning outlets published about the topic vs right-leaning
              outlets, using a 3-org consensus lean rating (AllSides, Ad Fontes
              Media, Media Bias Fact Check) for each outlet domain.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-right-blindspot" />
                <span>
                  <span className="font-medium text-text-primary">
                    Right-side blindspot
                  </span>
                  : left outlets ≥ 65% of left+right volume.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-left-blindspot" />
                <span>
                  <span className="font-medium text-text-primary">
                    Left-side blindspot
                  </span>
                  : right outlets ≥ 65% of left+right volume.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-balanced" />
                <span>
                  <span className="font-medium text-text-primary">
                    Balanced
                  </span>
                  : neither side reached 65%.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 border border-dashed border-hairline" />
                <span>
                  <span className="font-medium text-text-primary">
                    Not in top stories
                  </span>
                  : weekly volume below 25% of the topic&apos;s median, or no
                  snapshot was collected for that week.
                </span>
              </li>
            </ul>
            <p>
              <span className="font-medium text-text-primary">
                Chronic blindspot %
              </span>{" "}
              (in the ranked list below) is the share of in-coverage weeks that
              were any kind of one-sided blindspot. Weeks where the topic
              wasn&apos;t in the news at all, or where no live snapshot exists
              yet, are excluded so sparse topics aren&apos;t unfairly diluted.
            </p>
            <p>
              <span className="font-medium text-text-primary">
                Partial history
              </span>{" "}
              The grid always shows a 20 week window, but live data fills in one
              week at a time. Until enough weekly snapshots are collected, most
              cells stay empty. Rankings and percentages reflect only the weeks
              that actually have measurements, so early results can shift as
              more history accumulates.
            </p>
            <p>
              See the{" "}
              <a href="/about" className="text-highlight hover:underline">
                full methodology
              </a>{" "}
              for data sourcing, ingestion paths, and known limitations.
            </p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary/70">
              {isLiveData
                ? "Grid reflects real coverage counts. See the badge above for source and weeks collected."
                : "Grid shows illustrative mock data. Run npm run fetch-newsdata for live coverage."}
            </p>
          </div>
        )}
      </section>

      <SidePanelDrawer selection={selection} onClose={() => setSelection(null)} />
    </div>
  );
}
