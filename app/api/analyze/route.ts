import { NextResponse } from "next/server";
import type { ArticleAnalysis } from "@/lib/types";
import { MAX_ANALYZE_CHARS } from "@/lib/analysis/rubric";
import { analyzeWithLLM, isLLMConfigured } from "@/lib/analysis/llm";
import { analyzeHeuristic } from "@/lib/analysis/heuristic";
import { extractFromUrl } from "@/lib/analysis/extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AnalyzeBody {
  url?: string;
  text?: string;
}

export async function POST(req: Request) {
  let body: AnalyzeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const hasUrl = typeof body.url === "string" && body.url.trim().length > 0;
  const hasText = typeof body.text === "string" && body.text.trim().length > 0;
  if (!hasUrl && !hasText) {
    return NextResponse.json(
      { error: "Provide either a URL or article text." },
      { status: 400 }
    );
  }

  // Resolve the article text + metadata.
  let title: string | null = null;
  let byline: string | null = null;
  let extractedFrom: "url" | "text" = "text";
  let url: string | null = null;
  let text = "";

  try {
    if (hasUrl) {
      const extracted = await extractFromUrl(body.url!.trim());
      title = extracted.title;
      byline = extracted.byline;
      text = extracted.text;
      url = body.url!.trim();
      extractedFrom = "url";
    } else {
      text = body.text!.trim();
      extractedFrom = "text";
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to read article." },
      { status: 422 }
    );
  }

  const fullCharCount = text.length;
  const analyzedText =
    text.length > MAX_ANALYZE_CHARS ? text.slice(0, MAX_ANALYZE_CHARS) : text;

  // Run the analysis (LLM if configured, otherwise the heuristic fallback).
  let result;
  try {
    result = isLLMConfigured()
      ? await analyzeWithLLM(analyzedText, title)
      : analyzeHeuristic(analyzedText, title);
  } catch (err) {
    // If the LLM call fails, degrade gracefully to the heuristic.
    console.error("LLM analysis failed, falling back to heuristic:", err);
    result = analyzeHeuristic(analyzedText, title);
  }

  const analysis: ArticleAnalysis = {
    source: {
      title,
      url,
      byline,
      extractedFrom,
      charCount: fullCharCount,
    },
    analyzedText,
    ...result,
  };

  return NextResponse.json(analysis);
}
