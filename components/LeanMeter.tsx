import type { LeanLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

function colorForScore(score: number): string {
  if (score <= -1) return "#3B82F6";
  if (score >= 1) return "#EF4444";
  return "#6B7280";
}

/** AllSides-style -6…+6 lean meter with a positioned marker. */
export function LeanMeter({
  score,
  label,
}: {
  score: number;
  label: LeanLabel;
}) {
  // Map -6..6 to 0..100%.
  const pct = ((score + 6) / 12) * 100;
  const color = colorForScore(score);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">
          Article lean
        </span>
        <span
          className="font-display text-xl font-bold"
          style={{ color }}
        >
          {label}{" "}
          <span className="font-mono text-sm text-text-secondary">
            ({score > 0 ? "+" : ""}
            {score.toFixed(1)})
          </span>
        </span>
      </div>
      <div className="relative h-3 w-full bg-gradient-to-r from-left-blindspot via-balanced to-right-blindspot">
        <div
          className="absolute top-1/2 h-6 w-1 -translate-y-1/2 bg-text-primary shadow"
          style={{ left: `calc(${pct}% - 2px)` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-text-secondary">
        <span>Left −6</span>
        <span>Center 0</span>
        <span>Right +6</span>
      </div>
    </div>
  );
}

export function DimensionBar({
  name,
  score,
  note,
}: {
  name: string;
  score: number;
  note: string;
}) {
  const intensity = score / 10;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-text-primary">{name}</span>
        <span className="font-mono text-xs text-text-secondary">
          {score.toFixed(1)}/10
        </span>
      </div>
      <div className="mt-1 h-2 w-full bg-background">
        <div
          className={cn("h-2 transition-[width] duration-500")}
          style={{
            width: `${intensity * 100}%`,
            backgroundColor:
              score >= 6 ? "#EF4444" : score >= 3 ? "#F59E0B" : "#6B7280",
          }}
        />
      </div>
      {note && <p className="mt-1 text-xs text-text-secondary">{note}</p>}
    </div>
  );
}
