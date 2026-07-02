// Shared TypeScript interfaces for Blindspot Tracker.

export type BlindspotState =
  | "right-blindspot"
  | "left-blindspot"
  | "balanced"
  | "absent";

export type TopicName =
  | "Immigration"
  | "Climate"
  | "Gun Control"
  | "Healthcare"
  | "Foreign Policy"
  | "Economy"
  | "Education"
  | "Crime"
  | "Science"
  | "Local Politics"
  | "International"
  | "Religion";

/** Map of week id (e.g. "2024-W01") -> blindspot state for one topic. */
export type TopicSeries = Record<string, BlindspotState>;

export interface BlindspotHistory {
  weeks: string[];
  topics: Record<string, TopicSeries>;
}

export interface CoverageCategory {
  name: string;
  /** Share of coverage from left-leaning outlets, 0-100. */
  leftCoverage: number;
  /** Share of coverage from right-leaning outlets, 0-100. */
  rightCoverage: number;
  /** Total story count across the measured window. */
  totalVolume: number;
  /** Absolute distance from a 50/50 split, scaled to 0-100. */
  divergenceScore: number;
  /** Per-week divergence score for sparkline / trend use. */
  weeklyTrend: number[];
}

export interface CoverageGaps {
  weeks: string[];
  categories: CoverageCategory[];
}

/** A computed summary of how chronically a topic is blindspotted. */
export interface ChronicBlindspot {
  topic: string;
  /** Dominant blindspot side over the window. */
  dominantSide: "right-blindspot" | "left-blindspot" | "balanced";
  /** % of in-coverage weeks that were any kind of blindspot. */
  blindspotPct: number;
  /** % of weeks that were right-side blindspots. */
  rightPct: number;
  /** % of weeks that were left-side blindspots. */
  leftPct: number;
  /** Count of weeks the topic appeared in top stories. */
  coveredWeeks: number;
  totalWeeks: number;
}

/** Provenance marker describing where the current data came from. */
export interface DataSource {
  mode: "mock" | "live-gdelt" | "live-newsdata";
  fetchedAt: string | null;
  weeks: number;
  provider: string;
  biasSource: string;
  outletCount: number;
  /**
   * Number of weeks actually populated with real coverage. Relevant for
   * snapshot-based sources (e.g. NewsData) that accumulate history forward,
   * one week per run, rather than backfilling.
   */
  weeksCollected?: number;
}

/** A mock headline example surfaced in the side panel. */
export interface HeadlineExample {
  outlet: string;
  lean: "left" | "right" | "center";
  title: string;
}

// --- Per-article bias analysis ---------------------------------------------

export type LeanLabel =
  | "Left"
  | "Lean Left"
  | "Center"
  | "Lean Right"
  | "Right";

export type SpanType = "lexical" | "framing" | "source" | "omission";
export type SpanLean = "left" | "right" | "neutral";

/** A flagged phrase within the article, with an explanation of the bias. */
export interface BiasSpan {
  /** Verbatim substring copied from the analyzed text. */
  text: string;
  type: SpanType;
  lean: SpanLean;
  explanation: string;
}

/** A scored bias dimension (0 = none, 10 = strong). */
export interface BiasDimension {
  name: string;
  score: number;
  note: string;
}

export interface ArticleAnalysis {
  source: {
    title: string | null;
    url: string | null;
    byline: string | null;
    extractedFrom: "url" | "text";
    charCount: number;
  };
  /** AllSides-style numeric lean, -6 (far left) … +6 (far right). */
  leanScore: number;
  leanLabel: LeanLabel;
  /** Model/heuristic confidence, 0–1. */
  confidence: number;
  summary: string;
  dimensions: BiasDimension[];
  spans: BiasSpan[];
  /** The text that was analyzed (used to render highlights). */
  analyzedText: string;
  /** Which engine produced this analysis. */
  analyzer: "llm" | "heuristic";
  /** Model id when analyzer === "llm". */
  model?: string;
}
