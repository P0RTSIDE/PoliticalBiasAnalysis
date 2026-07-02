/**
 * fetch-real-data.mjs
 * --------------------
 * Builds Blindspot Tracker's data files from REAL public news-coverage data.
 *
 * Sources:
 *   - GDELT DOC 2.0 API (free, no key) for actual article volume per topic
 *     per outlet over time:  https://api.gdeltproject.org/api/v2/doc/doc
 *   - lib/outlet-bias.json for the outlet -> political-lean mapping
 *     (based on AllSides / Media Bias Fact Check public ratings).
 *
 * Method (mirrors Ground News blindspot logic):
 *   For each topic we measure how much LEFT-leaning vs RIGHT-leaning outlets
 *   covered it each week. A week where one side covered it heavily while the
 *   other largely ignored it is a "blindspot" for the ignoring side.
 *
 * Output: data/blindspot-history.json + data/coverage-gaps.json
 *         (exact same schema the app already consumes) and data/source.json
 *         (a marker recording provenance, shown as a badge in the UI).
 *
 * Usage:
 *   node scripts/fetch-real-data.mjs            # default 20 weeks
 *   node scripts/fetch-real-data.mjs --weeks 12
 *   node scripts/fetch-real-data.mjs --weeks 16 --delay 10000
 *
 * NOTE: GDELT rate-limits aggressively (≥1 request / 5s per IP) and rejects
 * queries that pack too many domain: clauses into one OR group. This script
 * chunks outlets into small groups (default 5 domains/query) and sums results.
 * Run from a residential network; increase --delay if you still see 429s.
 */

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(root, "data");
mkdirSync(dataDir, { recursive: true });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const NUM_WEEKS = Number(arg("weeks", 20));
const REQUEST_DELAY_MS = Number(arg("delay", 6000)); // GDELT-friendly spacing
const DOMAINS_PER_QUERY = Number(arg("chunk", 5)); // GDELT rejects long OR clauses
const DRY_RUN = args.includes("--dry-run");
const MAX_429_RETRIES = 2; // avoid retry spirals that refresh the IP penalty
const GDELT = "https://api.gdeltproject.org/api/v2/doc/doc";

// Classification thresholds (documented in the UI methodology).
const BLINDSPOT_SHARE = 0.65; // one side >=65% of L+R volume => other side blindspotted
const ABSENT_FRACTION = 0.25; // week total < 25% of topic median => "not in top stories"

// Topic -> GDELT search query. Multi-word phrases are quoted for exact match.
const TOPIC_QUERIES = {
  Immigration: '"immigration"',
  Climate: '"climate change"',
  "Gun Control": '"gun control"',
  Healthcare: '"health care"',
  "Foreign Policy": '"foreign policy"',
  Economy: '"the economy"',
  Education: '"education"',
  Crime: '"violent crime"',
  Science: '"scientific research"',
  "Local Politics": '"city council"',
  International: '"foreign affairs"',
  Religion: '"religion"',
};

// ---------------------------------------------------------------------------
// Outlet bias -> grouped domain lists
// ---------------------------------------------------------------------------
const bias = JSON.parse(
  readFileSync(join(root, "lib", "outlet-bias.json"), "utf8")
);

// Blend the three independent rating orgs (AllSides / Ad Fontes / MBFC) into a
// single consensus lean, mirroring Ground News' averaging methodology. Falls
// back to the precomputed `lean` if an outlet has no per-org ratings.
const LEAN_VALUE = { left: -2, "lean-left": -1, center: 0, "lean-right": 1, right: 2 };
const VALUE_LEAN = ["left", "lean-left", "center", "lean-right", "right"];

function consensusLean(outlet) {
  const r = outlet.ratings;
  if (!r) return outlet.lean;
  const vals = [r.allSides, r.adFontes, r.mbfc]
    .filter((v) => v in LEAN_VALUE)
    .map((v) => LEAN_VALUE[v]);
  if (vals.length === 0) return outlet.lean;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return VALUE_LEAN[Math.round(avg) + 2];
}

const leftDomains = [];
const rightDomains = [];
const centerDomains = [];
for (const o of bias.outlets) {
  const lean = consensusLean(o);
  if (lean === "left" || lean === "lean-left") leftDomains.push(o.domain);
  else if (lean === "right" || lean === "lean-right") rightDomains.push(o.domain);
  else centerDomains.push(o.domain);
}

function domainClause(domains) {
  return "(" + domains.map((d) => `domain:${d}`).join(" OR ") + ")";
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function addBuckets(a, b) {
  return a.map((v, i) => v + b[i]);
}

function countChunks(domains) {
  if (!domains.length) return 0;
  return Math.ceil(domains.length / DOMAINS_PER_QUERY);
}

function isFatalGdeltError(message) {
  return /too short or too long|invalid query|malformed/i.test(message);
}

// ---------------------------------------------------------------------------
// Week bucketing
// ---------------------------------------------------------------------------
function isoWeekId(date) {
  // ISO-8601 week number, labeled like "2026-W23".
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function startOfISOWeek(date) {
  const d = new Date(date);
  const day = d.getUTCDay() || 7;
  if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Build the most recent NUM_WEEKS complete ISO weeks (oldest -> newest).
const lastMonday = startOfISOWeek(new Date());
const weekStarts = [];
for (let i = NUM_WEEKS; i >= 1; i--) {
  const s = new Date(lastMonday);
  s.setUTCDate(s.getUTCDate() - 7 * i);
  weekStarts.push(s);
}
const weeks = weekStarts.map((s) => isoWeekId(s));
const windowStart = weekStarts[0];
const windowEnd = new Date(lastMonday); // exclusive end (start of current week)

function gdeltStamp(date) {
  const p = (n) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}` +
    `${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}`
  );
}

function weekIndexForDate(date) {
  // Returns index into `weeks` for a given date, or -1 if outside window.
  const t = date.getTime();
  for (let i = 0; i < weekStarts.length; i++) {
    const start = weekStarts[i].getTime();
    const end = i + 1 < weekStarts.length ? weekStarts[i + 1].getTime() : windowEnd.getTime();
    if (t >= start && t < end) return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// HTTP with throttle + backoff
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gdeltTimeline(query, startDate, endDate) {
  const url =
    `${GDELT}?query=${encodeURIComponent(query)}` +
    `&mode=timelinevolraw&format=json` +
    `&startdatetime=${gdeltStamp(startDate)}&enddatetime=${gdeltStamp(endDate)}`;

  let rateLimitAttempts = 0;

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "BlindspotTracker/1.0 (research prototype)" },
      });
      if (res.status === 429) {
        if (rateLimitAttempts >= MAX_429_RETRIES) {
          throw new Error("Rate limited by GDELT (429) — wait 10–15 min and retry");
        }
        rateLimitAttempts += 1;
        const wait = REQUEST_DELAY_MS * 3 * rateLimitAttempts;
        console.warn(`   429 rate-limited, pausing ${Math.ceil(wait / 1000)}s (${rateLimitAttempts}/${MAX_429_RETRIES})`);
        await sleep(wait);
        attempt -= 1; // retry same attempt slot after pause
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text.trim().startsWith("{")) {
        const err = new Error(`Non-JSON response: ${text.slice(0, 120)}`);
        if (isFatalGdeltError(text)) throw err; // don't retry bad queries
        throw err;
      }
      const json = JSON.parse(text);
      return json.timeline?.[0]?.data ?? [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isFatalGdeltError(msg) || /429/.test(msg)) throw err;
      if (attempt === 1) throw err;
      console.warn(`   transient error (${msg}); one retry in ${REQUEST_DELAY_MS}ms`);
      await sleep(REQUEST_DELAY_MS);
    }
  }
  return [];
}

function parseGdeltDate(s) {
  // Accepts "20260601T120000Z" or "2026-06-01T12:00:00Z".
  if (/^\d{8}T/.test(s)) {
    return new Date(
      `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00Z`
    );
  }
  return new Date(s);
}

/** Sum a GDELT daily timeline into per-week buckets. */
function bucketByWeek(dataPoints) {
  const buckets = new Array(weeks.length).fill(0);
  for (const pt of dataPoints) {
    const d = parseGdeltDate(pt.date);
    const idx = weekIndexForDate(d);
    if (idx >= 0) buckets[idx] += Number(pt.value) || 0;
  }
  return buckets;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function fetchGroup(topicQuery, domains) {
  if (!domains.length) return new Array(weeks.length).fill(0);

  const groups = chunk(domains, DOMAINS_PER_QUERY);
  let total = new Array(weeks.length).fill(0);

  for (const group of groups) {
    const query = `${topicQuery} ${domainClause(group)}`;
    const data = await gdeltTimeline(query, windowStart, windowEnd);
    total = addBuckets(total, bucketByWeek(data));
    await sleep(REQUEST_DELAY_MS);
  }

  return total;
}

function classify(left, right, total, topicMedian) {
  if (total < topicMedian * ABSENT_FRACTION) return "absent";
  const lr = left + right;
  if (lr === 0) return "absent";
  const leftShare = left / lr;
  if (leftShare >= BLINDSPOT_SHARE) return "right-blindspot";
  if (1 - leftShare >= BLINDSPOT_SHARE) return "left-blindspot";
  return "balanced";
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

async function main() {
  console.log(
    `Fetching real coverage for ${Object.keys(TOPIC_QUERIES).length} topics ` +
      `over ${NUM_WEEKS} weeks (${weeks[0]} … ${weeks[weeks.length - 1]}).`
  );
  console.log(
    `Outlets: ${leftDomains.length} left, ${centerDomains.length} center, ${rightDomains.length} right ` +
      `(${DOMAINS_PER_QUERY} domains/query).\n`
  );

  const requestsPerTopic =
    countChunks(leftDomains) + countChunks(rightDomains) + countChunks(centerDomains);
  const totalRequests = Object.keys(TOPIC_QUERIES).length * requestsPerTopic;

  if (DRY_RUN) {
    console.log("DRY RUN — no network calls. Validating logic:\n");
    console.log("Date window (UTC):", windowStart.toISOString(), "→", windowEnd.toISOString());
    console.log("Weeks:", weeks.join(", "));
    const sampleTopic = "Climate";
    const sampleGroup = chunk(leftDomains, DOMAINS_PER_QUERY)[0];
    console.log(`\nExample chunked query for "${sampleTopic}" (left, chunk 1/${countChunks(leftDomains)}):`);
    console.log(`  ${TOPIC_QUERIES[sampleTopic]} ${domainClause(sampleGroup)}`);
    console.log(
      `\nWould issue ${totalRequests} requests (~${Math.ceil(
        (totalRequests * REQUEST_DELAY_MS) / 1000 / 60
      )} min at ${REQUEST_DELAY_MS}ms spacing).`
    );
    return;
  }

  const topics = {};
  const categories = [];

  for (const [topic, q] of Object.entries(TOPIC_QUERIES)) {
    console.log(`• ${topic}`);
    const [leftWeekly, rightWeekly, centerWeekly] = [
      await fetchGroup(q, leftDomains),
      await fetchGroup(q, rightDomains),
      await fetchGroup(q, centerDomains),
    ];

    const totals = weeks.map(
      (_, i) => leftWeekly[i] + rightWeekly[i] + centerWeekly[i]
    );
    const lrTotals = weeks.map((_, i) => leftWeekly[i] + rightWeekly[i]);
    const med = median(totals.filter((t) => t > 0)) || 0;

    // Per-week blindspot states.
    const series = {};
    const weeklyDivergence = [];
    weeks.forEach((w, i) => {
      series[w] = classify(leftWeekly[i], rightWeekly[i], totals[i], med);
      const lr = lrTotals[i] || 1;
      const lShare = (leftWeekly[i] / lr) * 100;
      weeklyDivergence.push(Math.round(Math.abs(lShare - (100 - lShare))));
    });
    topics[topic] = series;

    // Aggregate category figures over the whole window.
    const sumLeft = leftWeekly.reduce((a, b) => a + b, 0);
    const sumRight = rightWeekly.reduce((a, b) => a + b, 0);
    const sumCenter = centerWeekly.reduce((a, b) => a + b, 0);
    const lr = sumLeft + sumRight || 1;
    const leftCoverage = Math.round((sumLeft / lr) * 100);
    const rightCoverage = 100 - leftCoverage;
    categories.push({
      name: topic,
      leftCoverage,
      rightCoverage,
      totalVolume: sumLeft + sumRight + sumCenter,
      divergenceScore: Math.abs(leftCoverage - rightCoverage),
      weeklyTrend: weeklyDivergence,
    });

    console.log(
      `   L:${sumLeft} R:${sumRight} C:${sumCenter}  -> left ${leftCoverage}% / right ${rightCoverage}%`
    );
  }

  writeFileSync(
    join(dataDir, "blindspot-history.json"),
    JSON.stringify({ weeks, topics }, null, 2) + "\n"
  );
  writeFileSync(
    join(dataDir, "coverage-gaps.json"),
    JSON.stringify({ weeks, categories }, null, 2) + "\n"
  );
  writeFileSync(
    join(dataDir, "source.json"),
    JSON.stringify(
      {
        mode: "live-gdelt",
        fetchedAt: new Date().toISOString(),
        weeks: NUM_WEEKS,
        provider: "GDELT DOC 2.0 API",
        biasSource: "AllSides / Ad Fontes Media / Media Bias Fact Check (3-org consensus)",
        outletCount: bias.outlets.length,
      },
      null,
      2
    ) + "\n"
  );

  console.log("\n✓ Wrote real data to data/*.json");
}

main().catch((err) => {
  console.error("\n✗ Fetch failed:", err.message);
  console.error(
    "If you are seeing 429s, wait 10–15 minutes with no GDELT traffic, then retry " +
      "with a higher --delay (e.g. 10000)."
  );
  process.exit(1);
});
