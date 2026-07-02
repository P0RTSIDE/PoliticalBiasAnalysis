"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { BiasSpan } from "@/lib/types";

const LEAN_STYLE: Record<BiasSpan["lean"], { bg: string; border: string }> = {
  left: { bg: "rgba(59,130,246,0.22)", border: "#3B82F6" },
  right: { bg: "rgba(239,68,68,0.22)", border: "#EF4444" },
  neutral: { bg: "rgba(245,158,11,0.20)", border: "#F59E0B" },
};

const SPAN_TYPE_LABEL: Record<BiasSpan["type"], string> = {
  lexical: "Word choice",
  framing: "Framing",
  source: "Source selection",
  omission: "Omission",
};

interface Range {
  start: number;
  end: number;
  span: BiasSpan;
}

interface TooltipState {
  span: BiasSpan;
  rect: DOMRect;
}

const VIEWPORT_PAD = 12;
const GAP = 8;

/** Keep a fixed tooltip fully inside the viewport. */
function clampTooltipPosition(
  anchor: DOMRect,
  tooltipW: number,
  tooltipH: number
): { left: number; top: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = anchor.top - GAP - tooltipH;
  if (top < VIEWPORT_PAD) {
    top = anchor.bottom + GAP;
  }
  top = Math.max(VIEWPORT_PAD, Math.min(top, vh - VIEWPORT_PAD - tooltipH));

  let left = anchor.left + anchor.width / 2 - tooltipW / 2;
  left = Math.max(VIEWPORT_PAD, Math.min(left, vw - VIEWPORT_PAD - tooltipW));

  return { left, top };
}

/** Render article text with flagged bias spans highlighted inline. */
export function HighlightedText({
  text,
  spans,
}: {
  text: string;
  spans: BiasSpan[];
}) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(
    null
  );
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!tooltip || !tooltipRef.current) {
      setTooltipPos(null);
      return;
    }
    const el = tooltipRef.current;
    setTooltipPos(
      clampTooltipPosition(tooltip.rect, el.offsetWidth, el.offsetHeight)
    );
  }, [tooltip]);

  // Resolve each span to its first non-overlapping occurrence in the text.
  const ranges: Range[] = [];
  const used: Array<[number, number]> = [];

  for (const span of spans) {
    let from = 0;
    while (from <= text.length) {
      const idx = text.indexOf(span.text, from);
      if (idx === -1) break;
      const end = idx + span.text.length;
      const overlaps = used.some(([s, e]) => idx < e && end > s);
      if (!overlaps) {
        ranges.push({ start: idx, end, span });
        used.push([idx, end]);
        break;
      }
      from = idx + 1;
    }
  }

  ranges.sort((a, b) => a.start - b.start);

  function showTooltip(span: BiasSpan, target: HTMLElement) {
    setTooltipPos(null);
    setTooltip({ span, rect: target.getBoundingClientRect() });
  }

  function hideTooltip() {
    setTooltip(null);
    setTooltipPos(null);
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((r, i) => {
    if (r.start > cursor) {
      nodes.push(<span key={`t-${i}`}>{text.slice(cursor, r.start)}</span>);
    }
    const style = LEAN_STYLE[r.span.lean];
    nodes.push(
      <mark
        key={`m-${i}`}
        className="cursor-help rounded-sm px-0.5 text-text-primary"
        style={{
          backgroundColor: style.bg,
          borderBottom: `2px solid ${style.border}`,
        }}
        onMouseEnter={(e) => showTooltip(r.span, e.currentTarget)}
        onMouseLeave={hideTooltip}
        onFocus={(e) => showTooltip(r.span, e.currentTarget)}
        onBlur={hideTooltip}
      >
        {text.slice(r.start, r.end)}
      </mark>
    );
    cursor = r.end;
  });
  if (cursor < text.length) {
    nodes.push(<span key="t-final">{text.slice(cursor)}</span>);
  }

  return (
    <>
      <div className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap border border-hairline bg-background p-4 text-sm leading-relaxed text-text-secondary">
        {nodes}
      </div>

      {tooltip && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="pointer-events-none fixed z-50 max-w-[min(20rem,calc(100vw-1.5rem))] border border-hairline bg-background px-3 py-2 text-xs leading-relaxed shadow-xl"
          style={{
            left: tooltipPos?.left ?? -9999,
            top: tooltipPos?.top ?? -9999,
            visibility: tooltipPos ? "visible" : "hidden",
          }}
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-secondary">
            {SPAN_TYPE_LABEL[tooltip.span.type]} · {tooltip.span.lean}
          </div>
          <p className="mt-1 text-text-primary">{tooltip.span.explanation}</p>
        </div>
      )}
    </>
  );
}
