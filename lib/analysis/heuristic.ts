import type { ArticleAnalysis, BiasSpan } from "@/lib/types";
import { clamp, leanLabelFromScore } from "./rubric";

/**
 * Transparent, dependency-free fallback used when no LLM is configured.
 * It is intentionally crude: a lexicon of loaded terms + framing verbs. It
 * exists so the /analyze page works out of the box and to make the LLM's
 * value obvious by comparison. NOT a serious classifier.
 */

// Terms more common in left-leaning framing of a story.
const LEFT_TERMS = [
  "far-right",
  "extremist",
  "anti-immigrant",
  "climate crisis",
  "gun violence",
  "assault weapon",
  "reproductive rights",
  "misinformation",
  "disinformation",
  "marginalized",
  "systemic",
  "tax cuts for the rich",
  "the wealthy",
  "election denier",
  "insurrection",
];

// Terms more common in right-leaning framing of a story.
const RIGHT_TERMS = [
  "radical left",
  "illegal aliens",
  "illegal immigrants",
  "open borders",
  "pro-life",
  "unborn",
  "woke",
  "mainstream media",
  "law and order",
  "tax relief",
  "job creators",
  "religious liberty",
  "election integrity",
  "big government",
  "far-left",
];

// Loaded attribution verbs that signal framing regardless of side.
const FRAMING_VERBS = [
  "slammed",
  "blasted",
  "claimed",
  "admitted",
  "refused",
  "lashed out",
  "doubled down",
  "touted",
  "peddled",
];

function findSpans(
  text: string,
  terms: string[],
  lean: BiasSpan["lean"],
  type: BiasSpan["type"],
  explanation: string
): { spans: BiasSpan[]; hits: number } {
  const spans: BiasSpan[] = [];
  let hits = 0;
  const lower = text.toLowerCase();
  for (const term of terms) {
    let from = 0;
    let idx = lower.indexOf(term, from);
    while (idx !== -1) {
      hits += 1;
      // Capture the verbatim casing from the original text.
      const verbatim = text.slice(idx, idx + term.length);
      if (!spans.some((s) => s.text === verbatim)) {
        spans.push({ text: verbatim, lean, type, explanation });
      }
      from = idx + term.length;
      idx = lower.indexOf(term, from);
    }
  }
  return { spans, hits };
}

export function analyzeHeuristic(
  text: string,
  _title: string | null
): Pick<
  ArticleAnalysis,
  "leanScore" | "leanLabel" | "confidence" | "summary" | "dimensions" | "spans" | "analyzer"
> {
  const left = findSpans(
    text,
    LEFT_TERMS,
    "left",
    "lexical",
    "Phrasing more common in left-leaning coverage."
  );
  const right = findSpans(
    text,
    RIGHT_TERMS,
    "right",
    "lexical",
    "Phrasing more common in right-leaning coverage."
  );
  const framing = findSpans(
    text,
    FRAMING_VERBS,
    "neutral",
    "framing",
    "Loaded attribution verb that editorializes the subject's action."
  );

  const net = right.hits - left.hits; // positive => right
  const total = left.hits + right.hits;
  // Scale net hits to the -6..6 range; saturates quickly by design.
  const leanScore = clamp(net * 1.5, -6, 6);

  const lexScore = clamp(total * 1.2, 0, 10);
  const framingScore = clamp(framing.hits * 1.5, 0, 10);

  const spans = [...left.spans, ...right.spans, ...framing.spans];

  return {
    leanScore,
    leanLabel: leanLabelFromScore(leanScore),
    confidence: total + framing.hits === 0 ? 0.15 : 0.35,
    summary:
      total === 0 && framing.hits === 0
        ? "No strongly partisan vocabulary detected by the keyword heuristic. This is a shallow lexical check. Configure an LLM for a real article-level assessment."
        : `Keyword heuristic found ${left.hits} left-coded and ${right.hits} right-coded term(s), plus ${framing.hits} loaded framing verb(s). This is a shallow lexical signal only. Configure an LLM for a calibrated, explained assessment.`,
    dimensions: [
      { name: "Word choice", score: lexScore, note: `${total} loaded term(s) detected.` },
      { name: "Source selection", score: 0, note: "Not assessed by the heuristic." },
      { name: "Framing & emphasis", score: framingScore, note: `${framing.hits} loaded verb(s).` },
      { name: "Omission", score: 0, note: "Not assessed by the heuristic." },
    ],
    spans,
    analyzer: "heuristic",
  };
}
