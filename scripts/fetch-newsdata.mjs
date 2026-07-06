/**
 * fetch-newsdata.mjs
 * ------------------
 * Builds Blindspot Tracker's data files from REAL coverage data via the
 * NewsData.io "latest" API (https://newsdata.io/api/1/latest).
 *
 * IMPORTANT — why this is a SNAPSHOT that accumulates:
 *   NewsData.io's free tier only exposes the last 48 HOURS of news (the
 *   historical /archive endpoint is paid-only). So a single run cannot
 *   backfill weeks of history — it can only measure coverage *right now*.
 *
 *   To still build the multi-week view the app shows, this script PERSISTS
 *   each run's measurement to data/snapshots.json, keyed by ISO week. Run it
 *   regularly (e.g. once a day or week) and real history accumulates forward:
 *   each new week's column fills in; weeks never collected stay empty
 *   ("not in top stories"). The more you run it, the deeper the real history.
 *
 * Method (mirrors Ground News blindspot logic):
 *   For each topic, count how many articles LEFT-leaning vs RIGHT-leaning
 *   outlets published in the last 48h (NewsData `totalResults`, 1 credit each).
 *   Outlet lean is the 3-org consensus from lib/outlet-bias.json
 *   (AllSides / Ad Fontes Media / Media Bias Fact Check).
 *
 * Free-tier limits handled here:
 *   - 200 credits/day, 30 credits / 15 min  -> built-in rate limiter.
 *   - max 5 domains per query                -> domains are chunked by 5.
 *   - q capped at 100 chars                  -> topic phrases are short.
 *   - 12h article delay                      -> fine for a daily/weekly cadence.
 *
 * Setup:
 *   1. Get a free key at https://newsdata.io/register
 *   2. Put it in .env.local:  NEWSDATA_API_KEY=pub_xxx
 *
 * Usage:
 *   node scripts/fetch-newsdata.mjs            # top 5 outlets/side (cheap, ~24 credits)
 *   node scripts/fetch-newsdata.mjs --full     # ALL outlets/side (higher fidelity, paced)
 *   node scripts/fetch-newsdata.mjs --include-center
 *   node scripts/fetch-newsdata.mjs --weeks 20 --delay 1500
 *   node scripts/fetch-newsdata.mjs --dry-run  # validate logic, no network/key needed
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(root, "data");
mkdirSync(dataDir, { recursive: true });

// ---------------------------------------------------------------------------
// Args + config
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--")
    ? args[i + 1]
    : fallback;
}
const NUM_WEEKS = Number(arg("weeks", 20));
const REQUEST_DELAY_MS = Number(arg("delay", 1500));
const TOP_PER_SIDE = Number(arg("top", 5));
const FULL = args.includes("--full");
const INCLUDE_CENTER = args.includes("--include-center");
const DRY_RUN = args.includes("--dry-run");

const API_BASE = "https://newsdata.io/api/1/latest";
const DOMAIN_PARAM = "domainurl"; // match outlets by domain URL
const DOMAINS_PER_QUERY = 5; // free/basic plan cap
const TIMEFRAME_HOURS = 48; // free tier ceiling
const LANGUAGE = "en";

// Free-tier rolling rate limit: 30 credits / 15 minutes.
const RATE_MAX = 30;
const RATE_WINDOW_MS = 15 * 60 * 1000;

// Blindspot classification (kept identical to the GDELT pipeline).
const BLINDSPOT_SHARE = 0.65;
const ABSENT_FRACTION = 0.25;

// Topic -> NewsData q phrase (multi-word phrases get exact-match quotes).
const TOPIC_QUERIES = {
  Immigration: "immigration",
  Climate: '"climate change"',
  "Gun Control": '"gun control"',
  Healthcare: '"health care"',
  "Foreign Policy": '"foreign policy"',
  Economy: "economy",
  Education: "education",
  Crime: '"violent crime"',
  Science: '"scientific research"',
  "Local Politics": '"city council"',
  International: '"foreign affairs"',
  Religion: "religion",
};

// ---------------------------------------------------------------------------
// Minimal .env.local loader (standalone node doesn't read Next.js env files).
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = join(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const raw of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv();
const API_KEY = process.env.NEWSDATA_API_KEY || "";

// ---------------------------------------------------------------------------
// Domain resolution cache. NewsData validates `domainurl` against its own
// registry and rejects unknown domains (e.g. cnn.com -> edition.cnn.com),
// suggesting replacements. We learn these corrections once and persist them.
// ---------------------------------------------------------------------------
const domainCachePath = join(dataDir, "newsdata-domains.json");
const domainCache = { fix: {}, bad: [] };
if (existsSync(domainCachePath)) {
  try {
    const c = JSON.parse(readFileSync(domainCachePath, "utf8"));
    Object.assign(domainCache.fix, c.fix || {});
    domainCache.bad = c.bad || [];
  } catch {
    /* ignore */
  }
}
const badDomains = new Set(domainCache.bad);
function saveDomainCache() {
  domainCache.bad = [...badDomains];
  writeFileSync(domainCachePath, JSON.stringify(domainCache, null, 2) + "\n");
}
function resolveDomain(d) {
  // Follow the fix chain (a suggestion may itself be remapped).
  let cur = d;
  const seen = new Set();
  while (domainCache.fix[cur] && !seen.has(cur)) {
    seen.add(cur);
    cur = domainCache.fix[cur];
  }
  return cur;
}

// ---------------------------------------------------------------------------
// Outlet bias -> grouped domains via 3-org consensus lean.
// ---------------------------------------------------------------------------
const bias = JSON.parse(
  readFileSync(join(root, "lib", "outlet-bias.json"), "utf8")
);
const LEAN_VALUE = { left: -2, "lean-left": -1, center: 0, "lean-right": 1, right: 2 };
const VALUE_LEAN = ["left", "lean-left", "center", "lean-right", "right"];
function consensusLean(o) {
  const r = o.ratings;
  if (!r) return o.lean;
  const vals = [r.allSides, r.adFontes, r.mbfc]
    .filter((v) => v in LEAN_VALUE)
    .map((v) => LEAN_VALUE[v]);
  if (!vals.length) return o.lean;
  return VALUE_LEAN[Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) + 2];
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

function sideDomains(all) {
  return FULL ? all : all.slice(0, TOP_PER_SIDE);
}
function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// ---------------------------------------------------------------------------
// ISO week helpers (current week is the LAST entry — that's where the snapshot
// lands; older weeks are filled from persisted snapshots).
// ---------------------------------------------------------------------------
function isoWeekId(date) {
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
const thisMonday = startOfISOWeek(new Date());
const weeks = [];
for (let i = NUM_WEEKS - 1; i >= 0; i--) {
  const s = new Date(thisMonday);
  s.setUTCDate(s.getUTCDate() - 7 * i);
  weeks.push(isoWeekId(s));
}
const currentWeek = isoWeekId(thisMonday);

// ---------------------------------------------------------------------------
// HTTP with a free-tier rate limiter (<=30 requests / 15 min).
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reqTimes = [];
async function rateLimit() {
  const now = Date.now();
  while (reqTimes.length && now - reqTimes[0] > RATE_WINDOW_MS) reqTimes.shift();
  if (reqTimes.length >= RATE_MAX) {
    const wait = RATE_WINDOW_MS - (now - reqTimes[0]) + 1000;
    console.log(`   rate cap hit (${RATE_MAX}/15min) — pausing ${Math.ceil(wait / 1000)}s…`);
    await sleep(wait);
  }
  reqTimes.push(Date.now());
}

// Issue one /latest request for a group of domains. Returns totalResults, or
// an { invalid } descriptor so the caller can heal the domain set and retry.
// NOTE: /latest already returns the last ~48h. The `timeframe` parameter is a
// paid-only feature (free tier rejects it with HTTP 422), so it's omitted.
async function requestCount(qPhrase, group) {
  const MAX_NET_RETRIES = 3;

  for (let netAttempt = 0; netAttempt <= MAX_NET_RETRIES; netAttempt++) {
    try {
      await rateLimit();
      const url =
        `${API_BASE}?apikey=${encodeURIComponent(API_KEY)}` +
        `&q=${encodeURIComponent(qPhrase)}` +
        `&${DOMAIN_PARAM}=${encodeURIComponent(group.join(","))}` +
        `&language=${LANGUAGE}`;
      const res = await fetch(url);
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Non-JSON response (HTTP ${res.status}): ${text.slice(0, 120)}`);
      }
      if (json.status === "success") {
        await sleep(REQUEST_DELAY_MS);
        return { total: Number(json.totalResults) || 0 };
      }
      // Healable case: an unregistered domain. Report it + suggestion.
      const invEntry = Array.isArray(json.results)
        ? json.results.find((r) => r && r.invalid_domain)
        : null;
      if (invEntry) {
        await sleep(REQUEST_DELAY_MS);
        return {
          invalid: invEntry.invalid_domain,
          suggestion: Array.isArray(invEntry.suggestion) ? invEntry.suggestion[0] : null,
        };
      }
      const msg = json.results?.message || json.message || JSON.stringify(json).slice(0, 160);
      if (res.status === 429) throw new Error(`Rate limited by NewsData (429): ${msg}`);
      throw new Error(`NewsData error (HTTP ${res.status}): ${msg}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = err instanceof Error && err.cause && typeof err.cause === "object" && "code" in err.cause
        ? String(err.cause.code)
        : "";
      const isNetwork = /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|ECONNREFUSED|socket hang up/i.test(
        `${msg} ${code}`
      );
      // API / quota errors should not be retried as network blips.
      if (!isNetwork || netAttempt === MAX_NET_RETRIES) throw err;
      const wait = 4000 * (netAttempt + 1);
      console.warn(`   network blip (${code || msg}) — retry ${netAttempt + 1}/${MAX_NET_RETRIES} in ${wait / 1000}s`);
      await sleep(wait);
    }
  }
  throw new Error("requestCount exhausted retries");
}

async function countArticles(qPhrase, domains) {
  let total = 0;
  for (const rawGroup of chunk(domains, DOMAINS_PER_QUERY)) {
    let attempts = 0;
    while (attempts++ < 12) {
      const group = [...new Set(rawGroup.map(resolveDomain))].filter(
        (d) => !badDomains.has(d)
      );
      if (!group.length) break;
      const r = await requestCount(qPhrase, group);
      if ("total" in r) {
        total += r.total;
        break;
      }
      // Heal: remap the invalid domain to its suggestion, or drop it. The next
      // loop iteration rebuilds the group via resolveDomain()/badDomains, so the
      // correction is applied automatically on retry.
      if (r.suggestion && r.suggestion !== r.invalid) {
        domainCache.fix[r.invalid] = r.suggestion;
        console.log(`   ↳ remapped ${r.invalid} → ${r.suggestion}`);
      } else {
        badDomains.add(r.invalid);
        console.log(`   ↳ dropped ${r.invalid} (no NewsData source)`);
      }
      saveDomainCache();
    }
  }
  return total;
}

// ---------------------------------------------------------------------------
// Classification + aggregation from accumulated snapshots.
// ---------------------------------------------------------------------------
function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  if (!s.length) return 0;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function classify(left, right, total, topicMedian) {
  if (total <= 0 || total < topicMedian * ABSENT_FRACTION) return "absent";
  const lr = left + right;
  if (lr === 0) return "absent";
  const leftShare = left / lr;
  if (leftShare >= BLINDSPOT_SHARE) return "right-blindspot";
  if (1 - leftShare >= BLINDSPOT_SHARE) return "left-blindspot";
  return "balanced";
}

function rebuildFromSnapshots(snapshots) {
  // snapshots: { weekId: { topic: { left, right, center } } }
  const topics = {};
  const categories = [];

  for (const topic of Object.keys(TOPIC_QUERIES)) {
    // Per-week totals across the visible window (for median + state).
    const perWeek = weeks.map((w) => snapshots[w]?.[topic] || null);
    const totals = perWeek
      .filter(Boolean)
      .map((c) => c.left + c.right + (c.center || 0))
      .filter((t) => t > 0);
    const med = median(totals);

    const series = {};
    const weeklyTrend = [];
    let sumLeft = 0;
    let sumRight = 0;
    let sumCenter = 0;

    weeks.forEach((w, i) => {
      const c = perWeek[i];
      if (!c) {
        series[w] = "absent";
        weeklyTrend.push(0);
        return;
      }
      const total = c.left + c.right + (c.center || 0);
      series[w] = classify(c.left, c.right, total, med);
      const lr = c.left + c.right || 1;
      const lShare = (c.left / lr) * 100;
      weeklyTrend.push(Math.round(Math.abs(lShare - (100 - lShare))));
      sumLeft += c.left;
      sumRight += c.right;
      sumCenter += c.center || 0;
    });
    topics[topic] = series;

    const lr = sumLeft + sumRight || 1;
    const leftCoverage = Math.round((sumLeft / lr) * 100);
    const rightCoverage = 100 - leftCoverage;
    categories.push({
      name: topic,
      leftCoverage,
      rightCoverage,
      totalVolume: sumLeft + sumRight + sumCenter,
      divergenceScore: Math.abs(leftCoverage - rightCoverage),
      weeklyTrend,
    });
  }

  return { topics, categories };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const usedLeft = sideDomains(leftDomains);
  const usedRight = sideDomains(rightDomains);
  const usedCenter = INCLUDE_CENTER ? sideDomains(centerDomains) : [];
  const perTopic =
    chunk(usedLeft, DOMAINS_PER_QUERY).length +
    chunk(usedRight, DOMAINS_PER_QUERY).length +
    chunk(usedCenter, DOMAINS_PER_QUERY).length;
  const totalReq = perTopic * Object.keys(TOPIC_QUERIES).length;

  console.log(
    `NewsData.io snapshot — ${Object.keys(TOPIC_QUERIES).length} topics, ` +
      `last ${TIMEFRAME_HOURS}h -> week ${currentWeek}.`
  );
  console.log(
    `Outlets counted: ${usedLeft.length} left, ${usedCenter.length} center, ` +
      `${usedRight.length} right (${FULL ? "FULL" : `top ${TOP_PER_SIDE}/side`}).`
  );
  console.log(`Estimated requests/credits: ${totalReq}.\n`);

  if (DRY_RUN) {
    console.log("DRY RUN — no network calls.");
    console.log("Visible weeks:", weeks.join(", "));
    console.log("\nExample query (Climate, left):");
    const grp = chunk(usedLeft, DOMAINS_PER_QUERY)[0] || [];
    console.log(
      `  ${API_BASE}?apikey=***&q=${encodeURIComponent(TOPIC_QUERIES.Climate)}` +
        `&${DOMAIN_PARAM}=${encodeURIComponent(grp.join(","))}` +
        `&language=${LANGUAGE}`
    );
    if (totalReq > 200) {
      console.log(
        `\n⚠ ${totalReq} requests exceeds the free 200/day cap. Use the default ` +
          `(top N/side) instead of --full, or split across days.`
      );
    }
    return;
  }

  if (!API_KEY) {
    console.error(
      "\n✗ No NEWSDATA_API_KEY found. Add it to .env.local:\n" +
        "    NEWSDATA_API_KEY=pub_xxxxxxxx\n" +
        "  Get a free key at https://newsdata.io/register"
    );
    process.exit(1);
  }

  const snapPath = join(dataDir, "snapshots.json");
  let store = { schema: 1, snapshots: {} };
  if (existsSync(snapPath)) {
    try {
      store = JSON.parse(readFileSync(snapPath, "utf8"));
      if (!store.snapshots) store.snapshots = {};
    } catch {
      /* start fresh on parse error */
    }
  }

  function persistProgress(todaySnapshot, final = false) {
    store.snapshots[currentWeek] = todaySnapshot;
    const visible = new Set(weeks);
    for (const w of Object.keys(store.snapshots)) {
      if (!visible.has(w)) delete store.snapshots[w];
    }
    writeFileSync(snapPath, JSON.stringify(store, null, 2) + "\n");

    const { topics, categories } = rebuildFromSnapshots(store.snapshots);
    writeFileSync(
      join(dataDir, "blindspot-history.json"),
      JSON.stringify({ weeks, topics }, null, 2) + "\n"
    );
    writeFileSync(
      join(dataDir, "coverage-gaps.json"),
      JSON.stringify({ weeks, categories }, null, 2) + "\n"
    );

    const weeksCollected = Object.keys(store.snapshots).length;
    writeFileSync(
      join(dataDir, "source.json"),
      JSON.stringify(
        {
          mode: "live-newsdata",
          fetchedAt: new Date().toISOString(),
          weeks: NUM_WEEKS,
          weeksCollected,
          provider: "NewsData.io (latest, 48h snapshots)",
          biasSource: "AllSides / Ad Fontes Media / Media Bias Fact Check (3-org consensus)",
          outletCount: usedLeft.length + usedCenter.length + usedRight.length,
        },
        null,
        2
      ) + "\n"
    );

    if (final) {
      console.log(
        `\n✓ Wrote real snapshot for ${currentWeek}. ${weeksCollected} of ${NUM_WEEKS} ` +
          `weeks now hold real data. Re-run periodically to accumulate more history.`
      );
    }
  }

  // Measure the current week.
  const todaySnapshot = {};
  for (const [topic, q] of Object.entries(TOPIC_QUERIES)) {
    process.stdout.write(`• ${topic} … `);
    const left = await countArticles(q, usedLeft);
    const right = await countArticles(q, usedRight);
    const center = usedCenter.length ? await countArticles(q, usedCenter) : 0;
    todaySnapshot[topic] = { left, right, center };
    console.log(`L:${left} R:${right} C:${center}`);
    persistProgress(todaySnapshot);
  }

  persistProgress(todaySnapshot, true);
}

main().catch((err) => {
  console.error("\n✗ Fetch failed:", err.message);
  if (/fetch failed|ECONNRESET|ETIMEDOUT|socket hang up/i.test(err.message)) {
    console.error(
      "Network connection dropped mid-fetch (common on café/public Wi‑Fi). " +
        "Partial progress is saved after each topic — re-run the same command to continue."
    );
  } else if (/429|rate/i.test(err.message)) {
    console.error(
      "Free tier allows 30 credits/15min and 200/day. Wait and re-run, or " +
        "use the default (top N/side) instead of --full."
    );
  }
  process.exit(1);
});
