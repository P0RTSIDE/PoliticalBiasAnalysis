import type { ArticleAnalysis, BiasDimension, BiasSpan } from "@/lib/types";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  clamp,
  leanLabelFromScore,
} from "./rubric";

/**
 * Provider-agnostic LLM client. Targets any OpenAI-compatible
 * /chat/completions endpoint, so it works with OpenAI, OpenRouter, Together,
 * Groq, or a local Ollama server — just point the env vars at your provider.
 *
 *   LLM_API_KEY    (required to enable LLM mode; absent => heuristic fallback)
 *   LLM_BASE_URL   (default https://api.openai.com/v1)
 *   LLM_MODEL      (default gpt-4o-mini)
 */
export function isLLMConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY);
}

export function llmModel(): string {
  return process.env.LLM_MODEL || "gpt-4o-mini";
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  // Strip ```json fences if present.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : trimmed;
  // Fall back to the first {...} block.
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in LLM response");
  return JSON.parse(body.slice(start, end + 1));
}

function coerceDimensions(input: unknown): BiasDimension[] {
  const fallbackNames = [
    "Word choice",
    "Source selection",
    "Framing & emphasis",
    "Omission",
  ];
  const arr = Array.isArray(input) ? input : [];
  const byName = new Map<string, BiasDimension>();
  for (const d of arr) {
    if (d && typeof d.name === "string") {
      byName.set(d.name, {
        name: d.name,
        score: clamp(Number(d.score) || 0, 0, 10),
        note: typeof d.note === "string" ? d.note : "",
      });
    }
  }
  return fallbackNames.map(
    (name) => byName.get(name) ?? { name, score: 0, note: "" }
  );
}

function coerceSpans(input: unknown, sourceText: string): BiasSpan[] {
  if (!Array.isArray(input)) return [];
  const valid: BiasSpan[] = [];
  for (const s of input) {
    if (!s || typeof s.text !== "string") continue;
    // Only keep spans that actually appear in the text (so we can highlight).
    if (!sourceText.includes(s.text)) continue;
    const type = ["lexical", "framing", "source", "omission"].includes(s.type)
      ? s.type
      : "framing";
    const lean = ["left", "right", "neutral"].includes(s.lean)
      ? s.lean
      : "neutral";
    valid.push({
      text: s.text,
      type,
      lean,
      explanation: typeof s.explanation === "string" ? s.explanation : "",
    });
  }
  return valid;
}

export async function analyzeWithLLM(
  text: string,
  title: string | null
): Promise<Pick<
  ArticleAnalysis,
  "leanScore" | "leanLabel" | "confidence" | "summary" | "dimensions" | "spans" | "analyzer" | "model"
>> {
  const baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  const model = llmModel();

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(text, title) },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  const parsed = extractJson(content) as Record<string, unknown>;

  const leanScore = clamp(Number(parsed.leanScore) || 0, -6, 6);
  return {
    leanScore,
    leanLabel: leanLabelFromScore(leanScore),
    confidence: clamp(Number(parsed.confidence) || 0.5, 0, 1),
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    dimensions: coerceDimensions(parsed.dimensions),
    spans: coerceSpans(parsed.spans, text),
    analyzer: "llm",
    model,
  };
}
