"use client";

import { useState } from "react";
import type { BlindspotHistory, BlindspotState } from "@/lib/types";
import {
  STATE_COLORS,
  STATE_LABELS,
  cn,
  weekNumber,
} from "@/lib/utils";
import type { DrawerSelection } from "./SidePanelDrawer";

interface BlindspotHeatmapProps {
  history: BlindspotHistory;
  topics: string[];
  weeks: string[];
  onCellClick: (selection: DrawerSelection) => void;
}

interface HoverState {
  topic: string;
  week: string;
  state: BlindspotState;
  x: number;
  y: number;
}

export function BlindspotHeatmap({
  history,
  topics,
  weeks,
  onCellClick,
}: BlindspotHeatmapProps) {
  const [hover, setHover] = useState<HoverState | null>(null);

  if (topics.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border border-hairline bg-surface text-sm text-text-secondary">
        Select at least one topic to view the blindspot grid.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[640px]">
          {/* Column headers (week labels) */}
          <div
            className="grid items-end gap-1 pb-2"
            style={{
              gridTemplateColumns: `7rem repeat(${weeks.length}, minmax(0, 1fr))`,
            }}
          >
            <div />
            {weeks.map((week) => (
              <div
                key={week}
                className="text-center font-mono text-[10px] text-text-secondary"
              >
                {weekNumber(week)}
              </div>
            ))}
          </div>

          {/* Rows */}
          {topics.map((topic, rowIdx) => {
            const series = history.topics[topic] ?? {};
            return (
              <div
                key={topic}
                className="grid items-center gap-1 py-0.5"
                style={{
                  gridTemplateColumns: `7rem repeat(${weeks.length}, minmax(0, 1fr))`,
                }}
              >
                <div className="truncate pr-3 text-right text-xs text-text-secondary">
                  {topic}
                </div>
                {weeks.map((week, colIdx) => {
                  const state: BlindspotState = series[week] ?? "absent";
                  const color = STATE_COLORS[state];
                  const isAbsent = state === "absent";
                  const delay = (rowIdx * 0.045 + colIdx * 0.012).toFixed(3);
                  return (
                    <button
                      key={week}
                      type="button"
                      aria-label={`${topic}, week ${weekNumber(week)}: ${STATE_LABELS[state]}`}
                      disabled={isAbsent}
                      onClick={() =>
                        !isAbsent && onCellClick({ topic, week, state })
                      }
                      onMouseEnter={(e) => {
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        setHover({
                          topic,
                          week,
                          state,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHover(null)}
                      onFocus={(e) => {
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        setHover({
                          topic,
                          week,
                          state,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onBlur={() => setHover(null)}
                      className={cn(
                        "group relative aspect-square w-full animate-cell-in transition-transform duration-150",
                        isAbsent
                          ? "cursor-default border border-dashed border-hairline/60"
                          : "cursor-pointer hover:z-10 hover:scale-125 hover:ring-1 hover:ring-white/40"
                      )}
                      style={{
                        backgroundColor: isAbsent ? "transparent" : color,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline pt-4">
        {(
          [
            "right-blindspot",
            "left-blindspot",
            "balanced",
            "absent",
          ] as BlindspotState[]
        ).map((state) => (
          <div key={state} className="flex items-center gap-2">
            <span
              className={cn(
                "h-3 w-3",
                state === "absent" && "border border-dashed border-hairline"
              )}
              style={{
                backgroundColor:
                  state === "absent" ? "transparent" : STATE_COLORS[state],
              }}
            />
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">
              {STATE_LABELS[state]}
            </span>
          </div>
        ))}
      </div>

      {/* Floating tooltip */}
      {hover && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full border border-hairline bg-background px-3 py-2 shadow-xl"
          style={{ left: hover.x, top: hover.y - 8 }}
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-secondary">
            {hover.topic} · Week {weekNumber(hover.week)}
          </div>
          <div
            className="text-xs font-medium"
            style={{
              color:
                hover.state === "absent"
                  ? "#9CA3AF"
                  : STATE_COLORS[hover.state],
            }}
          >
            {STATE_LABELS[hover.state]}
          </div>
        </div>
      )}
    </div>
  );
}
