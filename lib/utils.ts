import sourceData from "@/data/source.json";
import type {
  BlindspotHistory,
  BlindspotState,
  ChronicBlindspot,
  CoverageCategory,
  DataSource,
  HeadlineExample,
  TopicSeries,
} from "./types";

/** Current data provenance, read from data/source.json. */
export const dataSource = sourceData as DataSource;

/** True when the loaded data is real coverage (any "live-*" mode). */
export const isLiveData = dataSource.mode.startsWith("live");

/** Color tokens keyed by blindspot state. Mirrors the Tailwind palette. */
export const STATE_COLORS: Record<BlindspotState, string> = {
  "right-blindspot": "#EF4444",
  "left-blindspot": "#3B82F6",
  balanced: "#6B7280",
  absent: "transparent",
};

export const STATE_LABELS: Record<BlindspotState, string> = {
  "right-blindspot": "Right-side blindspot",
  "left-blindspot": "Left-side blindspot",
  balanced: "Balanced coverage",
  absent: "Not in top stories",
};

/** Human-readable description of what a blindspot state means. */
export const STATE_DESCRIPTIONS: Record<BlindspotState, string> = {
  "right-blindspot":
    "Left-leaning outlets covered this story heavily; right-leaning outlets largely did not.",
  "left-blindspot":
    "Right-leaning outlets covered this story heavily; left-leaning outlets largely did not.",
  balanced: "Outlets across the spectrum gave this story comparable coverage.",
  absent: "This topic did not appear among the week's top stories.",
};

/** Parse "2024-W07" -> 7. Returns the numeric week index for sorting/labels. */
export function weekNumber(weekId: string): number {
  const match = weekId.match(/W(\d+)/);
  return match ? Number(match[1]) : 0;
}

/** Short label for a week id, e.g. "W07". */
export function weekShortLabel(weekId: string): string {
  return `W${String(weekNumber(weekId)).padStart(2, "0")}`;
}

/**
 * Return the last `count` weeks from a full week list, preserving order.
 */
export function sliceRecentWeeks(weeks: string[], count: number): string[] {
  if (count >= weeks.length) return weeks;
  return weeks.slice(weeks.length - count);
}

/**
 * Compute chronic-blindspot stats for each topic over the given weeks.
 * blindspotPct is measured against weeks the topic was actually covered
 * (i.e. excludes "absent" weeks) so sparse topics aren't unfairly diluted.
 */
export function computeChronicBlindspots(
  history: BlindspotHistory,
  weeks: string[]
): ChronicBlindspot[] {
  const results: ChronicBlindspot[] = [];

  for (const [topic, series] of Object.entries(history.topics)) {
    let right = 0;
    let left = 0;
    let balanced = 0;
    let covered = 0;

    for (const week of weeks) {
      const state = series[week];
      if (!state || state === "absent") continue;
      covered += 1;
      if (state === "right-blindspot") right += 1;
      else if (state === "left-blindspot") left += 1;
      else balanced += 1;
    }

    const blindspots = right + left;
    const blindspotPct = covered ? Math.round((blindspots / covered) * 100) : 0;
    const rightPct = covered ? Math.round((right / covered) * 100) : 0;
    const leftPct = covered ? Math.round((left / covered) * 100) : 0;

    let dominantSide: ChronicBlindspot["dominantSide"] = "balanced";
    if (right > left && right >= balanced) dominantSide = "right-blindspot";
    else if (left > right && left >= balanced) dominantSide = "left-blindspot";

    results.push({
      topic,
      dominantSide,
      blindspotPct,
      rightPct,
      leftPct,
      coveredWeeks: covered,
      totalWeeks: weeks.length,
    });
  }

  // Most chronic first.
  return results.sort((a, b) => b.blindspotPct - a.blindspotPct);
}

/**
 * Divergence score = absolute distance from a perfect 50/50 left/right split,
 * scaled to a 0-100 range. A score of 0 means perfectly balanced coverage;
 * 100 means one side carried the story entirely.
 */
export function divergenceScore(
  leftCoverage: number,
  rightCoverage: number
): number {
  return Math.round(Math.abs(leftCoverage - rightCoverage));
}

/** Ratio describing how lopsided coverage is, e.g. 3.2 -> "3.2x". */
export function coverageRatio(category: CoverageCategory): {
  factor: number;
  side: "left" | "right";
} {
  const { leftCoverage, rightCoverage } = category;
  if (leftCoverage >= rightCoverage) {
    return {
      factor: Math.round((leftCoverage / Math.max(rightCoverage, 1)) * 10) / 10,
      side: "left",
    };
  }
  return {
    factor: Math.round((rightCoverage / Math.max(leftCoverage, 1)) * 10) / 10,
    side: "right",
  };
}

/** Format a number with thousands separators. */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Deterministically generate mock headline examples for a topic/week/state.
 * Real data would pull actual article metadata; this mirrors the shape.
 */
export function getHeadlineExamples(
  topic: string,
  weekId: string,
  state: BlindspotState
): HeadlineExample[] {
  const leftOutlets = ["The Atlantic", "Vox", "NPR", "The Guardian", "MSNBC"];
  const rightOutlets = ["Fox News", "National Review", "NY Post", "The Daily Wire", "Newsmax"];
  const centerOutlets = ["Reuters", "AP News", "BBC", "Axios"];

  const idx = weekNumber(weekId);
  const pick = <T,>(arr: T[], offset = 0): T => arr[(idx + offset) % arr.length];

  const angle = (lean: "left" | "right" | "center"): string => {
    const angles: Record<string, string[]> = {
      left: [
        `${topic}: advocates warn of long-term harm`,
        `New data reframes the ${topic.toLowerCase()} debate`,
        `Communities respond to ${topic.toLowerCase()} shift`,
      ],
      right: [
        `${topic}: critics question federal approach`,
        `${topic} costs draw scrutiny from lawmakers`,
        `What officials aren't saying about ${topic.toLowerCase()}`,
      ],
      center: [
        `${topic}: what the latest figures actually show`,
        `Explainer: the week in ${topic.toLowerCase()}`,
        `${topic} developments, by the numbers`,
      ],
    };
    return pick(angles[lean]);
  };

  if (state === "right-blindspot") {
    return [
      { outlet: pick(leftOutlets), lean: "left", title: angle("left") },
      { outlet: pick(leftOutlets, 2), lean: "left", title: angle("left") },
      { outlet: pick(centerOutlets), lean: "center", title: angle("center") },
    ];
  }
  if (state === "left-blindspot") {
    return [
      { outlet: pick(rightOutlets), lean: "right", title: angle("right") },
      { outlet: pick(rightOutlets, 2), lean: "right", title: angle("right") },
      { outlet: pick(centerOutlets), lean: "center", title: angle("center") },
    ];
  }
  if (state === "balanced") {
    return [
      { outlet: pick(leftOutlets), lean: "left", title: angle("left") },
      { outlet: pick(centerOutlets), lean: "center", title: angle("center") },
      { outlet: pick(rightOutlets), lean: "right", title: angle("right") },
    ];
  }
  return [];
}

/** Tailwind-friendly className combiner. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
