# Blindspot Tracker

**A media-analysis tool that visualizes how often news topics fall into political blindspots over time, and quantifies partisan coverage gaps by story category.**

Built to complement [Ground News](https://ground.news). Not affiliated with Ground News.

---

## What this is & why it was built

Ground News surfaces the stories each side of the political spectrum is under-covering _right now_ — a "blindspot." Blindspot Tracker takes the **long view**: instead of a snapshot, it shows which topics are _chronically_ blindspotted across weeks, and which story categories show the widest, most persistent coverage gaps between left- and right-leaning outlets.

It pairs three tools:

- **Blindspot History Analyzer** (`/blindspot-history`) — a longitudinal heatmap grid (topics × weeks) colored by blindspot type, with a ranked "most chronic blindspots" list and a click-through side panel of sample coverage.
- **Coverage Gap Study** (`/coverage-gap`) — a research view that quantifies partisan divergence by category with a horizontal bar chart, a volume-vs-polarization scatter plot, auto-generated findings, and a methodology accordion.
- **Article Bias Analyzer** (`/analyze`) — goes *below* the publication level: paste text or a URL and get an article-level lean score (AllSides −6…+6 scale), per-dimension bias breakdown (word choice, source selection, framing, omission), and the specific phrasing highlighted inline. Uses an LLM rubric, with a transparent keyword heuristic fallback when no LLM is configured.

The tone is deliberately neutral and analytical. Coverage asymmetry runs in both directions, and the data is presented symmetrically — the goal is to make partisan coverage gaps legible, not to argue that one side is "worse."

---

## Screenshots

> _Placeholder — add screenshots after running locally._

| Dashboard | Blindspot History | Coverage Gap |
| --- | --- | --- |
| `docs/screenshot-home.png` | `docs/screenshot-history.png` | `docs/screenshot-gap.png` |

---

## Tech stack

- **Framework:** [Next.js 14](https://nextjs.org) (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Charts:** [Recharts](https://recharts.org)
- **Fonts:** Playfair Display (display), Inter (UI), JetBrains Mono (data) via `next/font/google`
- **Data:** static JSON flat files — no database, no server-side fetching at request time
- **Real-data ingestion:** [GDELT DOC 2.0 API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) (free, no key) + AllSides/MBFC outlet-bias ratings
- **Deployment:** Vercel-ready

---

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

### Two ways to populate `/data`

The app reads whatever is in `data/*.json`. You can fill those files two ways:

**1. Real coverage data (recommended for demos & the Ground News pitch):**

```bash
npm run fetch-data            # last 20 weeks
npm run fetch-data -- --weeks 12 --delay 6000
```

This pulls **real** article-volume data from the free GDELT DOC 2.0 API, groups
it by outlet political lean (`lib/outlet-bias.json`, based on AllSides / Media
Bias Fact Check ratings), and computes blindspot states and divergence scores —
then writes the same JSON schema the app already consumes. It also writes
`data/source.json`, which flips the in-app badge to **"Live data."**

> ⚠️ GDELT rate-limits aggressively and **blocks many datacenter / cloud IPs
> with HTTP 429**. Run `fetch-data` from a normal residential or office network.
> The script already throttles requests and retries 429s with exponential
> backoff; raise `--delay` if you still get limited.

**2. Seeded illustrative mock data (offline fallback):**

```bash
npm run gen-data
```

A deterministic, fixed-seed generator that mirrors the blindspot frequencies
Ground News reports. Stable across runs; works with no network. The repo ships
with this mock data by default so the app runs out of the box.

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

> _One-click deploy button placeholder — point it at your fork's repo URL._

This repo includes a `vercel.json` declaring the Next.js framework. Because all data is static JSON and fonts load via `next/font`, **no environment variables are required** for a basic deploy:

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import it into Vercel ("New Project").
3. Vercel auto-detects Next.js — accept the defaults and deploy.

---

## Data methodology

For each topic and week, stories are grouped by the political lean of the outlets covering them (using independent media-bias ratings) and the week is classified into one of four states:

| State | Meaning |
| --- | --- |
| **Right-side blindspot** (red) | Left-leaning outlets covered it heavily; right-leaning outlets largely did not. |
| **Left-side blindspot** (blue) | Right-leaning outlets covered it heavily; left-leaning outlets largely did not. |
| **Balanced** (gray) | Outlets across the spectrum gave it comparable coverage. |
| **Not in top stories** (empty) | The topic did not rank among the week's most-covered stories. |

**Chronic blindspot %** is the share of a topic's _in-coverage_ weeks (excluding "not in top stories") that were a one-sided blindspot.

**Divergence score** for a category is the absolute distance between its left and right coverage shares:

```
divergence = | leftCoverage% − rightCoverage% |
```

A score of `0` is a perfect 50/50 split; `100` means one side carried the story entirely. The coverage ratio (e.g. "3x") expresses the same gap as a multiple.

### How the real numbers are derived (live mode)

`npm run fetch-data` reconstructs Ground News-style blindspots from public data:

1. **Coverage volume** — for each topic, query the GDELT DOC API for the number of articles published per day by a curated set of outlets, split into a **left** group and a **right** group (with **center** tracked for context).
2. **Outlet lean** — each outlet's domain is mapped to Left / Lean-Left / Center / Lean-Right / Right using **AllSides** + **Media Bias Fact Check** ratings (`lib/outlet-bias.json`). Left ∪ Lean-Left → "left"; Right ∪ Lean-Right → "right."
3. **Weekly bucketing** — daily volumes are summed into ISO weeks.
4. **Classification** — if one side accounts for ≥ 65% of left+right volume in a week, the other side is in a **blindspot**; otherwise the week is **balanced**. A week whose total volume falls below 25% of the topic's median is marked **not in top stories**.

These thresholds live as named constants at the top of `scripts/fetch-real-data.mjs` and are surfaced in the in-app methodology accordion.

> The bundled default is **illustrative mock data** so the app runs offline out of the box. Run `npm run fetch-data` to replace it with real coverage; the in-app badge then reads **"Live data."** Even in live mode, GDELT + third-party bias ratings are a *proxy* for the kind of first-party, cross-spectrum dataset Ground News maintains — see "For Ground News" below.

### Data files

- `data/blindspot-history.json` — N weeks × 12 topics, each cell a blindspot state.
- `data/coverage-gaps.json` — per-category left/right coverage shares, total volume, divergence score, and a weekly trend.
- `data/source.json` — provenance marker (`mock` vs `live-gdelt`) that drives the in-app data-source badge.
- `lib/outlet-bias.json` — curated outlet → political-lean lookup (AllSides / MBFC).

---

## Per-article bias analyzer (`/analyze`)

Publication-level ratings (the approach Ground News and the three rating orgs it averages all use) paint every story from an outlet with the same brush. This tool estimates a **single article's** lean from its own text.

- **Input:** paste article text, or give a URL (extracted server-side with Mozilla Readability — the Firefox Reader View engine).
- **Output:** an AllSides-style lean score (−6…+6) and label, a confidence value, a per-dimension breakdown (word choice / source selection / framing / omission), a plain-English summary, and the **exact phrases** that drove the score, highlighted inline and color-coded by lean.
- **Engine:** an LLM rubric via any **OpenAI-compatible** endpoint (OpenAI, OpenRouter, Groq, local Ollama, …). Configure with `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` (see `.env.example`).
- **No key? Still works.** Falls back to a transparent keyword/lexicon heuristic, clearly labeled "Heuristic (no LLM)" in the UI so results are never silently overstated.

**Honesty note:** article-level *bias* detection is tractable and useful; automated *factuality* is not solved and is intentionally **out of scope** here. The rubric is calibrated but fallible — treat scores as an analytical signal, not a verdict. (See the analyzer's footnote and the [media-bias research datasets](https://media-bias-research.org/) like BABE/BASIL for the state of the art.)

## For Ground News (the pitch)

This is a working proof-of-concept, not just a mockup. It already runs on **real, public coverage data** (GDELT) and **published bias ratings** (AllSides/MBFC). That proxy has real limits that *your* data would fix:

| Limitation of the GDELT + AllSides proxy | What Ground News' first-party data unlocks |
| --- | --- |
| Coverage approximated by article **volume** per domain | True story-clustering and per-story outlet counts you already compute |
| Bias from a curated ~50-outlet lookup | Your ratings across 60,000+ sources |
| Topics matched by keyword search | Your existing topic/interest taxonomy |
| GDELT history + rate limits | Direct, complete, rate-limit-free history |

**The ask:** access to (even a sampled / historical / rate-limited) Ground News blindspot or coverage dataset to replace the proxy. The ingestion layer is already isolated in `scripts/` and `.env` is wired for a `GROUND_NEWS_API_KEY` — swapping the source is a localized change, and every visualization in this app would immediately get sharper and more accurate.

## Future work

- **Ground News data integration** — swap the GDELT proxy for first-party data. The app consumes a fixed JSON shape; the access key would live in `.env` (see `.env.example`).
- **Automated weekly refresh** — a cron job (e.g. Vercel Cron / GitHub Action) that re-runs `fetch-data`, recomputes scores, and commits updated JSON each week.
- **User-submitted topic tracking** — let readers propose and follow custom topics, with email/RSS alerts when a topic enters a chronic blindspot.
- **Outlet-level drill-down** — expand the side panel into a full breakdown of which outlets did and didn't cover a story.
- **Shareable deep links** — encode topic/time-range filters in the URL for shareable analytical views.

---

## Project structure

```
app/
  page.tsx                    # Home dashboard
  blindspot-history/page.tsx  # Heatmap analyzer
  coverage-gap/page.tsx       # Coverage gap study
  analyze/page.tsx            # Per-article bias analyzer
  api/analyze/route.ts        # Bias analysis endpoint (URL extract + LLM/heuristic)
  about/page.tsx
components/
  BlindspotHeatmap.tsx        # Core heatmap grid
  TopicSelector.tsx           # Multi-select chip UI
  TimeRangeToggle.tsx
  CoverageBarChart.tsx        # Horizontal bar chart
  ScatterPlot.tsx             # Volume vs divergence scatter
  InsightCallout.tsx          # Highlighted finding card
  SidePanelDrawer.tsx         # Slide-in detail panel
  Nav.tsx
  Footer.tsx
  Skeleton.tsx                # Loading states
  DataSourceBadge.tsx         # "Live data" vs "mock" provenance badge
  LeanMeter.tsx               # -6..+6 lean meter + dimension bars
  HighlightedText.tsx         # Inline biased-phrase highlighting
lib/analysis/                 # Article-bias rubric, LLM client, heuristic, URL extractor
data/
  blindspot-history.json
  coverage-gaps.json
  source.json                 # Provenance marker (mock | live-gdelt)
lib/
  utils.ts                    # Score calculations, date helpers
  types.ts                    # TypeScript interfaces
  outlet-bias.json            # Outlet -> lean lookup (AllSides / MBFC)
scripts/
  gen-data.mjs                # Deterministic mock-data generator
  fetch-real-data.mjs         # Real ingestion via GDELT + outlet-bias
```

---

## Credit

This project exists because of, and in admiration of, **[Ground News](https://ground.news)** and its mission to give readers the tools to see the full picture and read across the spectrum.

_Built to complement Ground News. Not affiliated with Ground News._
