"use client";

import { useState } from "react";
import type { ArticleAnalysis, BiasSpan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LeanMeter, DimensionBar } from "@/components/LeanMeter";
import { HighlightedText } from "@/components/HighlightedText";
import { Skeleton } from "@/components/Skeleton";
import { WeeklyDataDisclaimer } from "@/components/WeeklyDataDisclaimer";

type Mode = "url" | "text";

const SPAN_TYPE_LABEL: Record<BiasSpan["type"], string> = {
  lexical: "Word choice",
  framing: "Framing",
  source: "Source selection",
  omission: "Omission",
};

const LEAN_DOT: Record<BiasSpan["lean"], string> = {
  left: "bg-left-blindspot",
  right: "bg-right-blindspot",
  neutral: "bg-highlight",
};

export default function AnalyzePage() {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ArticleAnalysis | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "url" ? { url } : { text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setResult(data as ArticleAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-highlight">
          Article Bias Analyzer
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          Per-article bias, not just the publication
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Publication-level ratings paint every story from an outlet with the
          same brush. This analyzes a single article&apos;s political lean from
          its own text: word choice, source selection, framing, and omission.
          It highlights the specific phrasing driving the score.
        </p>
        <WeeklyDataDisclaimer className="mt-4" scope="analyze" />
      </header>

      <div className="my-8 h-px bg-hairline" />

      {/* Input */}
      <form onSubmit={run} className="border border-hairline bg-surface p-4 sm:p-6">
        <div className="mb-4 inline-flex border border-hairline">
          {(["url", "text"] as Mode[]).map((m, i) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
                i > 0 && "border-l border-hairline",
                mode === m
                  ? "bg-highlight/10 text-highlight"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {m === "url" ? "From URL" : "Paste text"}
            </button>
          ))}
        </div>

        {mode === "url" ? (
          <input
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/news/article"
            className="w-full border border-hairline bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-highlight"
          />
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Paste the full article text here…"
            className="w-full resize-y border border-hairline bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-highlight"
          />
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || (mode === "url" ? !url.trim() : !text.trim())}
            className="bg-highlight px-5 py-2 font-mono text-xs uppercase tracking-widest text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Analyzing…" : "Analyze"}
          </button>
          <span className="font-mono text-[11px] text-text-secondary">
            Analyzes the article-level text, in U.S. political context.
          </span>
        </div>
      </form>

      {error && (
        <div className="mt-4 border border-right-blindspot/40 bg-right-blindspot/10 p-4 text-sm text-text-primary">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {result && !loading && (
        <section className="mt-8 space-y-6">
          {/* Source + analyzer provenance */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              {result.source.title && (
                <h2 className="truncate font-display text-xl font-bold text-text-primary">
                  {result.source.title}
                </h2>
              )}
              <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">
                {result.source.byline ? `${result.source.byline} · ` : ""}
                {result.source.charCount.toLocaleString()} chars
                {result.source.url ? " · from URL" : " · pasted text"}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-2 border border-hairline bg-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest",
                result.analyzer === "llm"
                  ? "text-left-blindspot"
                  : "text-highlight"
              )}
              title={
                result.analyzer === "llm"
                  ? `Analyzed by ${result.model}`
                  : "No LLM configured: shallow keyword heuristic"
              }
            >
              <span
                className={cn(
                  "h-2 w-2",
                  result.analyzer === "llm"
                    ? "bg-left-blindspot"
                    : "bg-highlight"
                )}
              />
              {result.analyzer === "llm"
                ? `LLM · ${result.model}`
                : "Heuristic (no LLM)"}
            </span>
          </div>

          {/* Lean meter + confidence */}
          <div className="border border-hairline bg-surface p-5">
            <LeanMeter score={result.leanScore} label={result.leanLabel} />
            <div className="mt-4 flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">
                Confidence
              </span>
              <div className="h-2 w-32 bg-background">
                <div
                  className="h-2 bg-text-secondary"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
              <span className="font-mono text-xs text-text-secondary">
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
            {result.summary && (
              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                {result.summary}
              </p>
            )}
          </div>

          {/* Dimensions */}
          <div className="border border-hairline bg-surface p-5">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-text-secondary">
              Bias by dimension
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {result.dimensions.map((d) => (
                <DimensionBar key={d.name} {...d} />
              ))}
            </div>
          </div>

          {/* Flagged spans */}
          <div className="border border-hairline bg-surface p-5">
            <h3 className="mb-1 font-mono text-xs uppercase tracking-widest text-text-secondary">
              Flagged phrasing ({result.spans.length})
            </h3>
            <p className="mb-4 text-xs text-text-secondary">
              Hover a highlight to see why it was flagged.
            </p>
            <HighlightedText text={result.analyzedText} spans={result.spans} />

            {result.spans.length > 0 && (
              <ul className="mt-4 space-y-2">
                {result.spans.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 border border-hairline bg-background p-3 text-sm"
                  >
                    <span
                      className={cn("mt-1.5 h-2 w-2 shrink-0", LEAN_DOT[s.lean])}
                    />
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-text-secondary">
                        {SPAN_TYPE_LABEL[s.type]} · {s.lean}
                      </span>
                      <p className="text-text-primary">
                        &ldquo;{s.text}&rdquo;
                      </p>
                      {s.explanation && (
                        <p className="mt-0.5 text-text-secondary">
                          {s.explanation}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="font-mono text-[11px] leading-relaxed text-text-secondary/70">
            Article-level estimate for U.S. political context. The LLM rubric is
            calibrated but not infallible; treat scores as an analytical signal,
            not a verdict. Configure an LLM (see README) for the full assessment.
            The heuristic fallback is a shallow keyword check only.
          </p>
        </section>
      )}
    </div>
  );
}
