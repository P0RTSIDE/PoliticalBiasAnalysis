# Blindspot Tracker

A media analysis web app that tracks **coverage asymmetry over time**: which news topics receive uneven attention across the political spectrum, week by week.

**Deploy:** Vercel (auto-deploy from `main`)

---

Most bias tools describe outlets. Blindspot Tracker describes **coverage**: when outlets on one side of the spectrum report heavily on a topic while outlets on the other largely do not, readers on the quieter side may never encounter the story in their usual feeds.

The app offers three views:

| View | Route | What it shows |
| --- | --- | --- |
| **Blindspot History** | `/blindspot-history` | Longitudinal heatmap (topics × weeks) with chronic blindspot rankings |
| **Coverage Gap Study** | `/coverage-gap` | Partisan divergence by category, volume vs. polarization charts, ranked findings |
| **Article Analyzer** | `/analyze` | Per-article lean score, dimension breakdown, and inline phrase highlighting |

---

## Tech stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Article extraction:** Mozilla Readability, JSDOM
- **Analysis:** OpenAI-compatible LLM API with keyword fallback
- **Data:** Precomputed JSON (static at build time, no database)
- **Ingestion:** Node.js ETL scripts (NewsData.io, GDELT DOC 2.0)
- **Deploy:** Vercel

---

## Architecture

```
scripts/          ETL pipelines → write data/*.json
data/             Weekly coverage snapshots + provenance (source.json)
lib/              Types, scoring utilities, outlet bias ratings, analysis rubric
app/              Pages + /api/analyze server route
components/       Heatmap, charts, disclaimers, UI
```

Coverage data is fetched offline, committed as JSON, and served statically. This keeps Vercel deploys fast and predictable while allowing weekly data refreshes via script or CI.

**Outlet bias:** 54 outlets rated using a three-organization consensus (AllSides, Ad Fontes Media, Media Bias Fact Check).

**Blindspot classification:** For each topic-week, if one side accounts for ≥65% of left+right article volume, the other side is in a blindspot; otherwise the week is balanced. Low-volume weeks are marked absent.

---

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build    # production build
npm run lint     # eslint
```

### Refresh coverage data

```bash
npm run fetch-newsdata          # Weekly NewsData.io snapshot (accumulates history)
npm run fetch-data              # GDELT backfill (20-week window)
npm run gen-data                # Regenerate sample data for offline demo
```

The live site uses NewsData.io snapshots collected week by week. The heatmap shows a 20-week window; weeks without a snapshot appear empty rather than estimated.

---

## Project structure

```
app/
  page.tsx                      Home
  blindspot-history/page.tsx    Heatmap analyzer
  coverage-gap/page.tsx         Coverage gap study
  analyze/page.tsx              Article bias analyzer
  api/analyze/route.ts          Analysis API (URL extract + LLM/fallback)
  about/page.tsx                Methodology
components/
  BlindspotHeatmap.tsx          Topic × week grid
  WeeklyDataDisclaimer.tsx      Partial-history notice
  CoverageBarChart.tsx          Divergence bars
  ScatterPlot.tsx               Volume vs polarization
  DataSourceBadge.tsx           Live vs sample data indicator
lib/
  outlet-bias.json                Outlet → political lean lookup
  analysis/                     LLM rubric, heuristic, URL extractor
scripts/
  fetch-newsdata.mjs            NewsData.io ingestion
  fetch-real-data.mjs           GDELT ingestion
  gen-data.mjs                  Sample data generator
data/
  blindspot-history.json
  coverage-gaps.json
  source.json
  snapshots.json
```

---

## Inspiration

Inspired by [Ground News](https://ground.news) and the idea that readers benefit from seeing what each part of the spectrum emphasizes or skips. Independent project; not affiliated with Ground News.
