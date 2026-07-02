"use client";

import { cn } from "@/lib/utils";

export const TIME_RANGES = [8, 16, 20] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

interface TimeRangeToggleProps {
  value: TimeRange;
  onChange: (next: TimeRange) => void;
}

export function TimeRangeToggle({ value, onChange }: TimeRangeToggleProps) {
  return (
    <div className="space-y-2">
      <span className="block font-mono text-[11px] uppercase tracking-widest text-text-secondary">
        Time range
      </span>
      <div
        role="radiogroup"
        aria-label="Select time range"
        className="inline-flex border border-hairline bg-surface"
      >
        {TIME_RANGES.map((range, i) => {
          const active = value === range;
          return (
            <button
              key={range}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(range)}
              className={cn(
                "px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
                i > 0 && "border-l border-hairline",
                active
                  ? "bg-highlight/10 text-highlight"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {range}w
            </button>
          );
        })}
      </div>
    </div>
  );
}
