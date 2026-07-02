import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Blindspot Tracker",
  description:
    "What Blindspot Tracker is, how blindspot states and divergence scores are calculated, and how live coverage data is sourced and accumulated.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-8">
      <h2 className="font-display text-2xl font-bold text-text-primary">
        {title}
      </h2>
      <div className="mt-3 space-y-4 text-sm leading-relaxed text-text-secondary">
        {children}
      </div>
    </section>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-hairline bg-surface p-4 font-mono text-xs text-text-primary">
      {children}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-highlight">
          About
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          A longitudinal lens on coverage asymmetry
        </h1>
        <p className="mt-3 text-base leading-relaxed text-text-secondary">
          Blindspot Tracker visualizes how often news topics fall into political
          blindspots over time, and quantifies the partisan coverage gaps
          between left- and right-leaning outlets by story category.
        </p>
      </header>

      <div className="my-6 h-px bg-hairline" />

      <Section title="What this project is">
        <p>
          Most media-bias tools tell you where an outlet sits on the political
          spectrum. Blindspot Tracker asks a different question:{" "}
          <em>who is covering what, and who is not?</em> When one side of the
          spectrum gives a story heavy attention while the other largely ignores
          it, readers on the ignoring side never see it in their normal news
          diet — a coverage blindspot.
        </p>
        <p>
          Snapshot tools show you today&apos;s blindspots. This project takes the{" "}
          <em>long view</em>: a week-by-week record of which topics were
          chronically blindspotted, which story categories show the widest and
          most persistent gaps, and — at the article level — which specific
          phrasing drives a single piece&apos;s lean.
        </p>
        <p>Three views, one dataset:</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>
            <Link
              href="/blindspot-history"
              className="text-highlight hover:underline"
            >
              Blindspot History Analyzer
            </Link>{" "}
            — a longitudinal heatmap (topics × weeks) colored by blindspot type,
            plus a ranked list of the most chronic offenders.
          </li>
          <li>
            <Link
              href="/coverage-gap"
              className="text-highlight hover:underline"
            >
              Coverage Gap Study
            </Link>{" "}
            — category-level divergence scores, a volume-vs-polarization scatter
            plot, and auto-generated findings.
          </li>
          <li>
            <Link href="/analyze" className="text-highlight hover:underline">
              Article Bias Analyzer
            </Link>{" "}
            — paste text or a URL and get an article-level lean score, a
            per-dimension breakdown, and inline highlighting of the phrases
            that drove the assessment.
          </li>
        </ul>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="How blindspot states are classified">
        <p>
          For each topic and ISO week, we measure how much coverage came from
          left-leaning outlets versus right-leaning outlets, then classify the
          week into one of four states:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-right-blindspot" />
            <span>
              <span className="font-medium text-text-primary">
                Right-side blindspot
              </span>{" "}
              — left-leaning outlets accounted for ≥ 65% of left+right article
              volume; right-leaning outlets largely did not cover the topic that
              week.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-left-blindspot" />
            <span>
              <span className="font-medium text-text-primary">
                Left-side blindspot
              </span>{" "}
              — the mirror image: right-leaning outlets carried ≥ 65% of
              left+right volume.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-balanced" />
            <span>
              <span className="font-medium text-text-primary">Balanced</span> —
              neither side reached the 65% threshold; outlets across the
              spectrum gave the topic comparable attention.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 border border-dashed border-hairline" />
            <span>
              <span className="font-medium text-text-primary">
                Not in top stories
              </span>{" "}
              — total volume for the week fell below 25% of that topic&apos;s
              median weekly volume across the window. The topic simply
              wasn&apos;t in the news that week.
            </span>
          </li>
        </ul>
        <p>
          Center-leaning outlets (Reuters, AP, BBC, etc.) are tracked for total
          volume context but excluded from the left/right split that drives
          blindspot classification — the question is specifically about
          partisan asymmetry, not overall newsworthiness.
        </p>
        <p>
          The 65% and 25% thresholds are named constants in the ingestion
          scripts and can be tuned. They mirror the kind of lopsidedness
          readers intuitively recognize as a blindspot without requiring a
          perfect 100/0 split.
        </p>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="Scores & metrics">
        <p>
          <span className="font-medium text-text-primary">
            Chronic blindspot %
          </span>{" "}
          is the share of a topic&apos;s <em>in-coverage</em> weeks (weeks
          where the topic was actually in the news — excluding &ldquo;not in
          top stories&rdquo;) that were a one-sided blindspot. A topic that was
          a right-side blindspot 14 of 16 covered weeks scores 88%. Sparse
          topics aren&apos;t penalized for weeks they simply weren&apos;t
          newsworthy.
        </p>
        <p>
          <span className="font-medium text-text-primary">Divergence score</span>{" "}
          measures how lopsided left vs right coverage is for a category over
          the whole window:
        </p>
        <CodeBlock>divergence = | leftCoverage% − rightCoverage% |</CodeBlock>
        <p>
          A score of 0 is a perfect 50/50 split; 100 means one side carried the
          category entirely. The coverage ratio (e.g. &ldquo;3.2×&rdquo;)
          expresses the same gap as a multiple — how many times more often the
          dominant side covered it.
        </p>
        <p>
          Pairing <span className="font-medium text-text-primary">volume</span>{" "}
          with divergence distinguishes a niche, lopsided topic (few stories,
          sharply split) from one that is both widely covered and sharply split
          — the scatter plot on the Coverage Gap page makes this visible at a
          glance.
        </p>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="Outlet bias ratings">
        <p>
          Each outlet in the curated set (~54 domains) is assigned a political
          lean using the <strong>consensus of three independent monitors</strong>,
          the same trio used by major cross-spectrum news aggregators:
        </p>
        <ul className="list-inside list-disc space-y-1 pl-1">
          <li>
            <a
              href="https://www.allsides.com/media-bias/media-bias-ratings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-highlight hover:underline"
            >
              AllSides
            </a>{" "}
            Media Bias Ratings
          </li>
          <li>
            <a
              href="https://adfontesmedia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-highlight hover:underline"
            >
              Ad Fontes Media
            </a>{" "}
            — Media Bias Chart
          </li>
          <li>
            <a
              href="https://mediabiasfactcheck.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-highlight hover:underline"
            >
              Media Bias/Fact Check
            </a>
          </li>
        </ul>
        <p>
          Each org&apos;s rating is mapped to a common 5-point scale (left,
          lean-left, center, lean-right, right). The consensus lean is the
          rounded average — no single source dominates. At fetch time, left ∪
          lean-left outlets form the &ldquo;left&rdquo; group; right ∪
          lean-right form the &ldquo;right&rdquo; group.
        </p>
        <p>
          Per-outlet ratings are stored in{" "}
          <code className="font-mono text-xs text-text-primary">
            lib/outlet-bias.json
          </code>
          . They reflect each organization&apos;s published online written-news
          placement at time of compilation and are approximate — outlet lean can
          shift over time.
        </p>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="Data sourcing & ingestion">
        <p>
          The app reads static JSON in{" "}
          <code className="font-mono text-xs text-text-primary">data/</code>.
          Two ingestion paths populate those files with real coverage data:
        </p>

        <p className="font-medium text-text-primary">
          GDELT DOC 2.0 (full history)
        </p>
        <p>
          The{" "}
          <a
            href="https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-highlight hover:underline"
          >
            GDELT DOC 2.0 API
          </a>{" "}
          is free and requires no key. For each topic it queries daily article
          volume per outlet domain over a configurable window (default 20 weeks),
          buckets counts into ISO weeks, and writes{" "}
          <code className="font-mono text-xs">blindspot-history.json</code>,{" "}
          <code className="font-mono text-xs">coverage-gaps.json</code>, and a
          provenance marker in{" "}
          <code className="font-mono text-xs">source.json</code>. Run with{" "}
          <code className="font-mono text-xs">npm run fetch-data</code>. GDELT
          rate-limits aggressively; run from a residential network and increase{" "}
          <code className="font-mono text-xs">--delay</code> if you hit 429s.
        </p>

        <p className="font-medium text-text-primary">
          NewsData.io (accumulating snapshots)
        </p>
        <p>
          An alternative when GDELT is unreachable. The free tier exposes only
          the last ~48 hours via the{" "}
          <code className="font-mono text-xs">/latest</code> endpoint — so each
          run captures a <em>snapshot</em> of current coverage, keyed by ISO
          week, and persists it to{" "}
          <code className="font-mono text-xs">data/snapshots.json</code>. Re-run{" "}
          <code className="font-mono text-xs">npm run fetch-newsdata</code>{" "}
          periodically and real history accumulates forward, one column at a
          time. Weeks never collected stay empty (&ldquo;not in top
          stories&rdquo;). Requires a free API key in{" "}
          <code className="font-mono text-xs">.env.local</code>.
        </p>

        <p className="font-medium text-text-primary">Mock data (offline default)</p>
        <p>
          The repo ships with seeded illustrative data (
          <code className="font-mono text-xs">npm run gen-data</code>) so the
          app runs out of the box with no network. The data-source badge on each
          page shows whether you are viewing live or mock data.
        </p>

        <div className="border-l-2 border-highlight bg-surface p-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">
            What live data is — and is not
          </p>
          <p className="mt-1 text-text-primary">
            Even in live mode, article <em>volume</em> per domain plus
            third-party bias ratings are a <em>proxy</em> for true
            story-clustering and per-story outlet counts. Topic matching uses
            keyword search, not a curated taxonomy. These limits are inherent to
            public APIs; first-party cross-spectrum datasets would be sharper.
          </p>
        </div>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="Article bias analyzer">
        <p>
          Publication-level ratings paint every story from an outlet with the
          same brush. The analyzer estimates a <em>single article&apos;s</em>{" "}
          lean from its own text across four dimensions:
        </p>
        <ul className="list-inside list-disc space-y-1 pl-1">
          <li>
            <span className="font-medium text-text-primary">Word choice</span> —
            loaded, partisan, or emotionally charged language vs neutral wording
          </li>
          <li>
            <span className="font-medium text-text-primary">
              Source selection
            </span>{" "}
            — whose voices are quoted and whose are omitted
          </li>
          <li>
            <span className="font-medium text-text-primary">
              Framing &amp; emphasis
            </span>{" "}
            — what the article foregrounds, headline framing, story angle
          </li>
          <li>
            <span className="font-medium text-text-primary">Omission</span> —
            relevant context or perspectives left out
          </li>
        </ul>
        <p>
          Output is an AllSides-style numeric lean (−6 far left … +6 far right)
          with a categorical label, a confidence value, per-dimension strength
          scores (0–10), a plain-English summary, and verbatim phrase highlights
          color-coded by lean.
        </p>
        <p>
          <span className="font-medium text-text-primary">LLM mode</span> — when{" "}
          <code className="font-mono text-xs">LLM_API_KEY</code> is configured,
          any OpenAI-compatible endpoint (OpenAI, OpenRouter, Groq, local
          Ollama) runs a structured rubric against the article text. The model
          is instructed to judge only the provided text, not the outlet&apos;s
          reputation.
        </p>
        <p>
          <span className="font-medium text-text-primary">
            Heuristic fallback
          </span>{" "}
          — without a key (or if the LLM call fails), a transparent keyword
          lexicon scans for left- and right-coded terms and loaded framing verbs.
          Results are clearly labeled &ldquo;Heuristic (no LLM)&rdquo; so they
          are never silently overstated. Automated factuality assessment is
          intentionally out of scope.
        </p>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="Limitations">
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>
            Coverage is approximated by <em>article count</em>, not unique story
            clustering — ten briefs on the same event count as ten.
          </li>
          <li>
            Topic matching is keyword-based; a story about immigration policy
            buried under a different headline may be missed.
          </li>
          <li>
            Outlet lean is a publication-level prior, not an article-level
            judgment (except on the /analyze page).
          </li>
          <li>
            NewsData.io free snapshots cover only ~48h per run; longitudinal
            depth grows only as you re-run the fetch.
          </li>
          <li>
            Side-panel headline examples in the heatmap are illustrative unless
            wired to real article metadata.
          </li>
        </ul>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="A note on tone">
        <p>
          This is a media-analysis tool, not a political one. Coverage
          asymmetry runs in both directions, and the data is presented
          symmetrically. The goal is to make partisan coverage gaps legible —
          not to argue that one side is &ldquo;worse.&rdquo;
        </p>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="Inspiration">
        <p>
          This project was inspired by{" "}
          <a
            href="https://ground.news"
            target="_blank"
            rel="noopener noreferrer"
            className="text-highlight hover:underline"
          >
            Ground News
          </a>{" "}
          and its mission to help readers see the full picture by reading
          across the spectrum. Blindspot Tracker is an independent project — it
          is not affiliated with, endorsed by, or maintained by Ground News.
        </p>
      </Section>
    </div>
  );
}
