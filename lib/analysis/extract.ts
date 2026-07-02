import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export interface ExtractedArticle {
  title: string | null;
  byline: string | null;
  text: string;
}

/**
 * Fetch a URL and extract the main article text with Mozilla Readability
 * (the engine behind Firefox Reader View). Server-side only.
 *
 * Note: respect publishers' terms of service. This is for a research/demo
 * prototype; for production use licensed feeds or analyze only excerpts.
 */
export async function extractFromUrl(url: string): Promise<ExtractedArticle> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are supported.");
  }

  const res = await fetch(parsed.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; BlindspotTracker/1.0; +research-prototype)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Could not fetch the page (HTTP ${res.status}).`);
  }
  const html = await res.text();

  const dom = new JSDOM(html, { url: parsed.toString() });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  const text = (article?.textContent ?? "").replace(/\s+\n/g, "\n").trim();
  if (!text || text.length < 200) {
    throw new Error(
      "Couldn't extract enough article text from that URL. Try pasting the text instead."
    );
  }

  return {
    title: article?.title ?? dom.window.document.title ?? null,
    byline: article?.byline ?? null,
    text,
  };
}
