"use client";

import { useEffect, useRef } from "react";
import type { BlindspotState } from "@/lib/types";
import {
  STATE_COLORS,
  STATE_DESCRIPTIONS,
  STATE_LABELS,
  getHeadlineExamples,
  weekNumber,
} from "@/lib/utils";

export interface DrawerSelection {
  topic: string;
  week: string;
  state: BlindspotState;
}

interface SidePanelDrawerProps {
  selection: DrawerSelection | null;
  onClose: () => void;
}

const LEAN_COLORS: Record<string, string> = {
  left: "#3B82F6",
  right: "#EF4444",
  center: "#9CA3AF",
};

export function SidePanelDrawer({ selection, onClose }: SidePanelDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selection) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selection, onClose]);

  if (!selection) return null;

  const { topic, week, state } = selection;
  const headlines = getHeadlineExamples(topic, week, state);
  const accent = STATE_COLORS[state];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${topic} coverage in week ${weekNumber(week)}`}>
      <div
        className="absolute inset-0 animate-fade-backdrop bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md animate-slide-in flex-col border-l border-hairline bg-surface shadow-2xl">
        <div className="flex items-start justify-between border-b border-hairline p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5" style={{ backgroundColor: accent === "transparent" ? "#3A3A3A" : accent }} />
              <span className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">
                Week {weekNumber(week)} · {week}
              </span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold text-text-primary">
              {topic}
            </h2>
            <p className="mt-1 text-sm font-medium" style={{ color: accent === "transparent" ? "#9CA3AF" : accent }}>
              {STATE_LABELS[state]}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-8 w-8 items-center justify-center border border-hairline text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-sm leading-relaxed text-text-secondary">
            {STATE_DESCRIPTIONS[state]}
          </p>

          <div className="my-5 h-px bg-hairline" />

          {headlines.length > 0 ? (
            <>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-text-secondary">
                Sample coverage that week
              </h3>
              <ul className="space-y-3">
                {headlines.map((h, i) => (
                  <li
                    key={i}
                    className="border border-hairline bg-background p-3"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className="h-2 w-2"
                        style={{ backgroundColor: LEAN_COLORS[h.lean] }}
                      />
                      <span className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">
                        {h.outlet} · {h.lean}
                      </span>
                    </div>
                    <p className="text-sm leading-snug text-text-primary">
                      {h.title}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-text-secondary/70">
                Sample headlines for layout demonstration.
              </p>
            </>
          ) : (
            <p className="text-sm text-text-secondary">
              This topic did not appear among the week&apos;s top stories, so no
              coverage samples are available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
