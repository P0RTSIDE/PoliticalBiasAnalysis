// One-off data generator. Produces deterministic, realistic mock data that
// mirrors Ground News blindspot patterns. Run with: node scripts/gen-data.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });

// Deterministic PRNG (mulberry32) so output is stable across runs.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SEED = Number(process.argv[2] ?? 123);
const rand = mulberry32(SEED);

const NUM_WEEKS = 20;
const weeks = Array.from(
  { length: NUM_WEEKS },
  (_, i) => `2024-W${String(i + 1).padStart(2, "0")}`
);

// Each topic gets a probability profile for the four states.
// States: right-blindspot, left-blindspot, balanced, absent
const profiles = {
  Immigration: { right: 0.65, left: 0.05, balanced: 0.25, absent: 0.05 },
  Climate: { right: 0.7, left: 0.03, balanced: 0.22, absent: 0.05 },
  "Gun Control": { right: 0.55, left: 0.08, balanced: 0.27, absent: 0.1 },
  Healthcare: { right: 0.1, left: 0.4, balanced: 0.4, absent: 0.1 },
  "Foreign Policy": { right: 0.08, left: 0.22, balanced: 0.6, absent: 0.1 },
  Economy: { right: 0.18, left: 0.2, balanced: 0.5, absent: 0.12 },
  Education: { right: 0.28, left: 0.27, balanced: 0.33, absent: 0.12 },
  Crime: { right: 0.08, left: 0.6, balanced: 0.22, absent: 0.1 },
  Science: { right: 0.75, left: 0.04, balanced: 0.16, absent: 0.05 },
  "Local Politics": { right: 0.12, left: 0.13, balanced: 0.2, absent: 0.55 },
  International: { right: 0.12, left: 0.18, balanced: 0.55, absent: 0.15 },
  Religion: { right: 0.3, left: 0.22, balanced: 0.28, absent: 0.2 },
};

function pick(profile) {
  const r = rand();
  let acc = 0;
  acc += profile.right;
  if (r < acc) return "right-blindspot";
  acc += profile.left;
  if (r < acc) return "left-blindspot";
  acc += profile.balanced;
  if (r < acc) return "balanced";
  return "absent";
}

const topics = {};
for (const [name, profile] of Object.entries(profiles)) {
  const series = {};
  for (const w of weeks) series[w] = pick(profile);
  topics[name] = series;
}

const history = { weeks, topics };
writeFileSync(
  join(dataDir, "blindspot-history.json"),
  JSON.stringify(history, null, 2) + "\n"
);

// --- Coverage gaps -------------------------------------------------------
const categoryDefs = [
  { name: "Climate & Environment", left: 78, total: 340 },
  { name: "Immigration & Border", left: 74, total: 410 },
  { name: "Science & Research", left: 81, total: 220 },
  { name: "Crime & Public Safety", left: 28, total: 365 },
  { name: "Gun Policy", left: 71, total: 255 },
  { name: "Healthcare", left: 63, total: 300 },
  { name: "Economy & Markets", left: 47, total: 480 },
  { name: "Foreign Policy", left: 55, total: 295 },
  { name: "Education", left: 58, total: 210 },
  { name: "Elections & Voting", left: 52, total: 520 },
  { name: "Religion & Culture", left: 44, total: 180 },
  { name: "Immigration Enforcement", left: 33, total: 240 },
];

const categories = categoryDefs.map((c) => {
  const leftCoverage = c.left;
  const rightCoverage = 100 - c.left;
  // Divergence score: absolute distance from a 50/50 split, scaled to 0-100.
  const divergenceScore = Math.round(Math.abs(leftCoverage - rightCoverage));
  // Weekly trend of divergence score, wobbling around the baseline.
  const weeklyTrend = weeks.map((_, i) => {
    const wobble = Math.round((rand() - 0.5) * 14);
    return Math.max(2, Math.min(96, divergenceScore + wobble + (i % 5) - 2));
  });
  return {
    name: c.name,
    leftCoverage,
    rightCoverage,
    totalVolume: c.total,
    divergenceScore,
    weeklyTrend,
  };
});

const gaps = { weeks, categories };
writeFileSync(
  join(dataDir, "coverage-gaps.json"),
  JSON.stringify(gaps, null, 2) + "\n"
);

// Provenance marker so the UI can label this as illustrative mock data.
writeFileSync(
  join(dataDir, "source.json"),
  JSON.stringify(
    {
      mode: "mock",
      fetchedAt: null,
      weeks: NUM_WEEKS,
      provider: "Seeded deterministic generator (scripts/gen-data.mjs)",
      biasSource: "AllSides / Ad Fontes Media / Media Bias Fact Check (applied in live mode)",
      outletCount: 54,
    },
    null,
    2
  ) + "\n"
);

// Report achieved frequencies for sanity.
for (const [name, series] of Object.entries(topics)) {
  const counts = { "right-blindspot": 0, "left-blindspot": 0, balanced: 0, absent: 0 };
  for (const v of Object.values(series)) counts[v]++;
  console.log(
    name.padEnd(16),
    `R:${counts["right-blindspot"]} L:${counts["left-blindspot"]} B:${counts.balanced} A:${counts.absent}`
  );
}
console.log("Wrote data files.");
