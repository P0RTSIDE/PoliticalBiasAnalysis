import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Blindspot Tracker",
  description:
    "Methodology, data provenance, and scope of Blindspot Tracker's coverage asymmetry analysis.",
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
          Coverage asymmetry over time
        </h1>
        <p className="mt-3 text-base leading-relaxed text-text-secondary">
          Blindspot Tracker maps which news topics receive uneven attention
          across the political spectrum, week by week. It is built for readers
          who want to see patterns in who covers what, not just where individual
          outlets sit on a bias chart.
        </p>
      </header>

      <div className="my-6 h-px bg-hairline" />

      <Section title="What the site does">
        <p>
          Most bias tools describe outlets. This site describes coverage: when
          outlets on one side of the spectrum report heavily on a topic while
          outlets on the other largely do not, audiences on the quieter side may
          never encounter the story in their usual feeds. That gap is what the
          site calls a blindspot.
        </p>
        <p>
          The emphasis is longitudinal. Rather than flagging a single day&apos;s
          imbalance, the heatmap and rankings show which topics recur as
          one sided blindspots across many weeks, and which categories show the
          widest split between left and right leaning coverage over the full
          window.
        </p>
        <p>The site offers three related views:</p>
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>
            The{" "}
            <Link
              href="/blindspot-history"
              className="text-highlight hover:underline"
            >
              Blindspot History Analyzer
            </Link>{" "}
            plots topics against weeks and classifies each cell as balanced, a
            left or right side blindspot, or absent from the week&apos;s top
            stories.
          </li>
          <li>
            The{" "}
            <Link
              href="/coverage-gap"
              className="text-highlight hover:underline"
            >
              Coverage Gap Study
            </Link>{" "}
            aggregates the same underlying counts by category, with divergence
            scores and a volume versus polarization chart.
          </li>
          <li>
            The{" "}
            <Link href="/analyze" className="text-highlight hover:underline">
              Article Bias Analyzer
            </Link>{" "}
            scores individual articles on word choice, sourcing, framing, and
            omission, separate from the outlet level ratings used elsewhere.
          </li>
        </ul>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="How weeks are classified">
        <p>
          For each topic and calendar week, the site compares article volume
          from left leaning outlets against volume from right leaning outlets.
          Center outlets (Reuters, AP, BBC, and similar) appear in total volume
          figures but do not enter the left/right split, because the question
          here is partisan asymmetry, not overall prominence.
        </p>
        <p>Each topic-week receives one of four labels:</p>
        <ul className="space-y-2">
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-right-blindspot" />
            <span>
              <span className="font-medium text-text-primary">
                Right side blindspot
              </span>
              : left leaning outlets accounted for at least 65% of combined
              left and right volume; right leaning outlets gave the topic
              comparatively little attention.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-left-blindspot" />
            <span>
              <span className="font-medium text-text-primary">
                Left side blindspot
              </span>
              : the same rule, with right leaning outlets carrying at least 65%
              of combined left and right volume.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-2.5 shrink-0 bg-balanced" />
            <span>
              <span className="font-medium text-text-primary">Balanced</span>:
              neither side reached the 65% threshold.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 border border-dashed border-hairline" />
            <span>
              <span className="font-medium text-text-primary">
                Not in top stories
              </span>
              : total volume for that week fell below one quarter of the
              topic&apos;s typical weekly volume in the window, indicating the
              topic was not a major story that week.
            </span>
          </li>
        </ul>
        <p>
          The 65% and 25% cutoffs are fixed rules applied uniformly. They are
          meant to capture clear lopsidedness without requiring that one side
          ignore a topic entirely.
        </p>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="Scores and rankings">
        <p>
          <span className="font-medium text-text-primary">
            Chronic blindspot percentage
          </span>{" "}
          measures how often a topic was a one sided blindspot during weeks when
          it was actually in the news. Weeks marked &ldquo;not in top
          stories&rdquo; are excluded so quiet topics are not treated as if they
          were blindspotted when they simply were not newsworthy.
        </p>
        <p>
          <span className="font-medium text-text-primary">Divergence score</span>{" "}
          summarizes left versus right share for a category across the full
          period:
        </p>
        <CodeBlock>divergence = | leftCoverage% − rightCoverage% |</CodeBlock>
        <p>
          Zero indicates an even split. One hundred would mean a category was
          covered entirely on one side. The coverage ratio shown in the gap
          study expresses the same imbalance as a multiple (for example, one
          side covering a topic three times as often as the other).
        </p>
        <p>
          Volume and divergence are reported together so a category can be read
          as niche but polarized, or widely covered and still sharply split.
        </p>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="Outlet lean ratings">
        <p>
          Coverage is grouped using a curated set of roughly fifty outlet
          domains. Each domain is assigned a lean on a five point scale (left,
          lean left, center, lean right, right) by averaging published
          placements from three independent monitors:
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
            </a>
          </li>
          <li>
            <a
              href="https://adfontesmedia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-highlight hover:underline"
            >
              Ad Fontes Media
            </a>
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
          Left and lean left outlets are combined into a single left group;
          right and lean right into a single right group. The ratings reflect
          each organization&apos;s public written news classifications at the
          time they were compiled and may not match every reader&apos;s
          judgment of a given outlet.
        </p>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="Data sources and provenance">
        <p>
          The charts on this site are built from precomputed JSON files, not
          live queries at page load. A badge on the data pages states whether
          you are viewing live coverage figures or illustrative placeholder
          data, along with how many weeks of real measurements are included and
          when the figures were last updated.
        </p>

        <p className="font-medium text-text-primary">Live coverage figures</p>
        <p>
          When the badge reads live data, article counts come from public news
          APIs. The primary source in current deployments is{" "}
          <a
            href="https://newsdata.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-highlight hover:underline"
          >
            NewsData.io
          </a>
          , which reports how many articles matching a topic appeared at
          selected outlet domains within a recent window. Historical depth
          builds as new weekly snapshots are added; weeks without a snapshot
          appear empty on the heatmap rather than as fabricated values.
        </p>
        <p>
          An alternate pipeline can draw from the{" "}
          <a
            href="https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-highlight hover:underline"
          >
            GDELT DOC 2.0
          </a>{" "}
          archive, which supports longer backfills in principle. Availability
          depends on network access to GDELT&apos;s public endpoint.
        </p>

        <p className="font-medium text-text-primary">Illustrative data</p>
        <p>
          If no live snapshot has been loaded, the site may ship with seeded
          figures designed to demonstrate layout and typical blindspot patterns.
          The badge labels this clearly. Illustrative data should not be cited
          as empirical findings.
        </p>

        <div className="border-l-2 border-highlight bg-surface p-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">
            What a careful reader should know
          </p>
          <p className="mt-1 text-text-primary">
            Live figures here are a proxy. Topics are matched by keyword, not by
            a human curated story taxonomy. Counts reflect article volume per
            domain, not deduplicated story clusters. Outlet lean comes from
            third party ratings applied at the publication level. Services with
            first party cross spectrum data can resolve those ambiguities more
            precisely; this site trades that precision for transparency and
            reproducibility from open inputs.
          </p>
        </div>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="Article analyzer">
        <p>
          The outlet groupings above describe where a publication sits. The
          analyzer describes a single piece of text. It returns an AllSides
          style score from far left to far right, a confidence estimate, scores
          on four dimensions (word choice, source selection, framing, omission),
          and highlighted phrases that contributed to the assessment.
        </p>
        <p>
          When a language model is available, analysis follows a fixed rubric
          applied only to the submitted text. When it is not, the site falls
          back to a simpler keyword based method and labels the result
          accordingly. The tool estimates framing and emphasis; it does not
          assess factual accuracy.
        </p>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="Known limitations">
        <ul className="list-inside list-disc space-y-2 pl-1">
          <li>
            Multiple articles on the same event count separately; there is no
            story level deduplication.
          </li>
          <li>
            Keyword topic matching will miss relevant coverage filed under
            different language and may include unrelated hits.
          </li>
          <li>
            Heatmap side panel headlines are sample text unless tied to
            retrieved article metadata.
          </li>
          <li>
            Longitudinal depth under NewsData depends on how many weekly
            snapshots exist; sparse columns are an honest record of missing
            data, not a bug.
          </li>
        </ul>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="Editorial stance">
        <p>
          The site is an analysis instrument. Coverage gaps run in both
          directions, and the presentation treats left and right blindspots
          symmetrically. The intent is to make asymmetry visible for inspection,
          not to rank sides or declare one narrative correct.
        </p>
      </Section>

      <div className="h-px bg-hairline" />

      <Section title="Inspiration">
        <p>
          Blindspot Tracker was inspired by{" "}
          <a
            href="https://ground.news"
            target="_blank"
            rel="noopener noreferrer"
            className="text-highlight hover:underline"
          >
            Ground News
          </a>{" "}
          and the idea that readers benefit from seeing what each part of the
          spectrum emphasizes or skips. It is an independent project and is not
          affiliated with, endorsed by, or maintained by Ground News.
        </p>
      </Section>
    </div>
  );
}
