import "server-only";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { createAdminClient } from "../supabase/admin";
import { ONLINE_NOW_WINDOW_SECONDS, type CtaKey, type TrafficSource } from "./constants";

export type DateRangeKey = "today" | "7d" | "30d";

export interface DateWindow {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
}

/**
 * The business (The Puppy Plugs) operates out of Newark, DE - reporting
 * days are defined by Eastern time, not by whatever timezone the server
 * process happens to be running in. This matters concretely: hosting
 * platforms (e.g. Vercel) default Node's runtime to UTC, which is 4-5
 * hours ahead of Eastern. Without correcting for this, "Today" would
 * start at midnight UTC (= 7-8pm the previous evening in Newark), so
 * everything from early evening onward would silently roll into
 * tomorrow's bucket instead of today's - exactly the "fresh evening
 * traffic disappears" failure mode this must avoid.
 */
const BUSINESS_TIME_ZONE = "America/New_York";

/**
 * "Midnight, business-local time, on the business-local calendar date
 * `now` falls on" - correct regardless of the server process's own
 * runtime timezone, and correct across DST transitions (fromZonedTime
 * resolves the actual UTC offset in effect for that calendar date, not
 * a fixed offset).
 */
function startOfTodayInBusinessTimeZone(now: Date): Date {
  const zonedNow = toZonedTime(now, BUSINESS_TIME_ZONE);
  const wallClockMidnight = new Date(zonedNow.getFullYear(), zonedNow.getMonth(), zonedNow.getDate(), 0, 0, 0, 0);
  return fromZonedTime(wallClockMidnight, BUSINESS_TIME_ZONE);
}

/**
 * Comparison windows (section 15 of the approved spec):
 *   - today      -> the exact same elapsed clock time yesterday (not
 *                   yesterday's full 24h - comparing a partial today
 *                   against a full yesterday would be misleading)
 *   - last 7 days  -> the preceding 7-day window
 *   - last 30 days -> the preceding 30-day window
 * In every case this is done by shifting [start, end) back by its own
 * span, which naturally produces the "same elapsed time yesterday"
 * behavior for "today" too.
 */
export function getDateWindow(range: DateRangeKey): DateWindow {
  const now = new Date();
  const startOfToday = startOfTodayInBusinessTimeZone(now);

  let start: Date;
  if (range === "today") {
    start = startOfToday;
  } else if (range === "7d") {
    start = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
  } else {
    start = new Date(startOfToday.getTime() - 29 * 24 * 60 * 60 * 1000);
  }

  const end = now;
  const spanMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime());
  const prevStart = new Date(prevEnd.getTime() - spanMs);

  return { start, end, prevStart, prevEnd };
}

export interface MetricComparison {
  value: number;
  previousValue: number;
  /** null = no meaningful percentage (previous period had zero activity and current didn't). */
  percentChange: number | null;
}

function computeComparison(current: number, previous: number): MetricComparison {
  let percentChange: number | null;
  if (previous === 0) {
    percentChange = current === 0 ? 0 : null;
  } else {
    percentChange = ((current - previous) / previous) * 100;
  }
  return { value: current, previousValue: previous, percentChange };
}

async function countDistinctVisitors(start: Date, end: Date): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("analytics_events")
    .select("visitor_id")
    .gte("occurred_at", start.toISOString())
    .lt("occurred_at", end.toISOString());
  return new Set((data || []).map((r: any) => r.visitor_id)).size;
}

async function countEventsOfType(eventType: string, start: Date, end: Date): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", eventType)
    .gte("occurred_at", start.toISOString())
    .lt("occurred_at", end.toISOString());
  return count || 0;
}

export interface TopMetrics {
  visitors: MetricComparison;
  pageViews: MetricComparison;
  puppyViews: MetricComparison;
  ctaClicks: MetricComparison;
}

/** The 4 top metric cards that carry a period-over-period comparison (Online Now is separate and has none - see getOnlineNow). */
export async function getTopMetrics(range: DateRangeKey): Promise<TopMetrics> {
  const { start, end, prevStart, prevEnd } = getDateWindow(range);

  const [visitorsNow, visitorsPrev, pageViewsNow, pageViewsPrev, puppyViewsNow, puppyViewsPrev, ctaNow, ctaPrev] =
    await Promise.all([
      countDistinctVisitors(start, end),
      countDistinctVisitors(prevStart, prevEnd),
      countEventsOfType("page_view", start, end),
      countEventsOfType("page_view", prevStart, prevEnd),
      countEventsOfType("puppy_view", start, end),
      countEventsOfType("puppy_view", prevStart, prevEnd),
      countEventsOfType("cta_click", start, end),
      countEventsOfType("cta_click", prevStart, prevEnd),
    ]);

  return {
    visitors: computeComparison(visitorsNow, visitorsPrev),
    pageViews: computeComparison(pageViewsNow, pageViewsPrev),
    puppyViews: computeComparison(puppyViewsNow, puppyViewsPrev),
    ctaClicks: computeComparison(ctaNow, ctaPrev),
  };
}

export interface TrafficOverviewPoint {
  label: string;
  visitors: number;
  pageViews: number;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${period}`;
}

/**
 * Bucket key + display label, both derived from the SAME business-local
 * (America/New_York) calendar components - not the server runtime's own
 * timezone. This is what keeps "Today" bucketed by NY-local hour and
 * "Last 7/30 Days" bucketed by NY-local calendar day, regardless of
 * whether the server process itself runs in UTC (e.g. on Vercel) or
 * anything else.
 */
function bucketKeyFor(d: Date, hourly: boolean): { key: string; label: string } {
  const zoned = toZonedTime(d, BUSINESS_TIME_ZONE);
  const year = zoned.getFullYear();
  const month = zoned.getMonth();
  const day = zoned.getDate();
  const hour = zoned.getHours();

  if (hourly) {
    return { key: `${year}-${month}-${day}-${hour}`, label: formatHourLabel(hour) };
  }
  return { key: `${year}-${month}-${day}`, label: `${MONTH_LABELS[month]} ${day}` };
}

/**
 * "Today" is bucketed by hour (a single-point line chart for a day view
 * isn't useful); "Last 7/30 Days" are bucketed by calendar day, matching
 * the reference dashboard's daily-bucket chart.
 */
export async function getTrafficOverview(range: DateRangeKey): Promise<TrafficOverviewPoint[]> {
  const { start, end } = getDateWindow(range);
  const admin = createAdminClient();

  // One query covers both lines: "Visitors" buckets distinct visitor_id
  // across every event type, "Page Views" buckets only event_type =
  // 'page_view' rows - both computed from this single result set below.
  const { data: events } = await admin
    .from("analytics_events")
    .select("visitor_id, event_type, occurred_at")
    .gte("occurred_at", start.toISOString())
    .lt("occurred_at", end.toISOString());

  const hourly = range === "today";
  // sortMs is the bucket's own seed timestamp (real elapsed ms, not the
  // string key) - sorting buckets by that, rather than by the "Y-M-D"
  // string key, avoids a lexicographic-ordering bug where e.g. day "10"
  // would otherwise sort before day "9" (breaks near every month
  // boundary, which any 30-day range - and most 7-day ranges - crosses).
  const buckets = new Map<string, { label: string; sortMs: number; visitors: Set<string>; pageViews: number }>();

  // Seed every bucket in the range so gaps show as zero, not a missing
  // point. Stepping by a fixed real-time increment (1 hour/1 day) and
  // then keying each step by its zoned calendar components is correct
  // for bucketing purposes here, even across a DST transition.
  const cursor = new Date(start);
  while (cursor < end) {
    const { key, label } = bucketKeyFor(cursor, hourly);
    if (!buckets.has(key)) buckets.set(key, { label, sortMs: cursor.getTime(), visitors: new Set(), pageViews: 0 });
    cursor.setTime(cursor.getTime() + (hourly ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
  }

  for (const row of events || []) {
    const d = new Date((row as any).occurred_at);
    const { key, label } = bucketKeyFor(d, hourly);
    let bucket = buckets.get(key);
    if (!bucket) {
      // An event landed just outside the seeded range's exact step
      // boundaries (e.g. right at `end`) - still count it rather than
      // silently drop it.
      bucket = { label, sortMs: d.getTime(), visitors: new Set(), pageViews: 0 };
      buckets.set(key, bucket);
    }
    bucket.visitors.add((row as any).visitor_id);
    if ((row as any).event_type === "page_view") bucket.pageViews += 1;
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.sortMs - b.sortMs)
    .map((bucket) => ({ label: bucket.label, visitors: bucket.visitors.size, pageViews: bucket.pageViews }));
}

export interface MostViewedPuppy {
  puppyId: string;
  name: string;
  slug: string;
  photoUrl: string;
  views: number;
}

export async function getMostViewedPuppies(range: DateRangeKey, limit = 5): Promise<MostViewedPuppy[]> {
  const { start, end } = getDateWindow(range);
  const admin = createAdminClient();

  const { data } = await admin
    .from("analytics_events")
    .select("puppy_id")
    .eq("event_type", "puppy_view")
    .not("puppy_id", "is", null)
    .gte("occurred_at", start.toISOString())
    .lt("occurred_at", end.toISOString());

  const counts = new Map<string, number>();
  for (const row of data || []) {
    const id = (row as any).puppy_id as string;
    counts.set(id, (counts.get(id) || 0) + 1);
  }

  const ranked = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (ranked.length === 0) return [];

  const { data: puppies } = await admin
    .from("puppies")
    .select("id, name, breed, slug, photo_urls")
    .in(
      "id",
      ranked.map(([id]) => id)
    );

  const puppyById = new Map((puppies || []).map((p: any) => [p.id, p]));

  return ranked
    .map(([puppyId, views]) => {
      const puppy = puppyById.get(puppyId);
      if (!puppy) return null;
      return {
        puppyId,
        name: puppy.name || puppy.breed || "Unknown",
        slug: puppy.slug,
        photoUrl: (Array.isArray(puppy.photo_urls) ? puppy.photo_urls[0] : "") || "",
        views,
      };
    })
    .filter((x): x is MostViewedPuppy => x !== null);
}

export interface TrafficSourceBreakdown {
  source: TrafficSource;
  count: number;
  percent: number;
}

const TRAFFIC_SOURCE_ORDER: TrafficSource[] = ["facebook_instagram", "direct", "google", "referral_other"];

/**
 * Attributes each visitor active in the range to the traffic_source of
 * their EARLIEST session that started within the range (first-touch,
 * within-period) - a visitor with multiple sessions in the period is
 * only counted once, so these counts always sum to the period's total
 * Visitors figure, matching the donut's center number.
 */
export async function getTrafficSources(range: DateRangeKey): Promise<{ total: number; breakdown: TrafficSourceBreakdown[] }> {
  const { start, end } = getDateWindow(range);
  const admin = createAdminClient();

  const { data } = await admin
    .from("analytics_sessions")
    .select("visitor_id, traffic_source, started_at")
    .gte("started_at", start.toISOString())
    .lt("started_at", end.toISOString())
    .order("started_at", { ascending: true });

  const firstSourceByVisitor = new Map<string, TrafficSource>();
  for (const row of data || []) {
    const visitorId = (row as any).visitor_id as string;
    if (!firstSourceByVisitor.has(visitorId)) {
      firstSourceByVisitor.set(visitorId, (row as any).traffic_source as TrafficSource);
    }
  }

  const counts = new Map<TrafficSource, number>();
  for (const source of firstSourceByVisitor.values()) {
    counts.set(source, (counts.get(source) || 0) + 1);
  }

  const total = firstSourceByVisitor.size;
  const breakdown = TRAFFIC_SOURCE_ORDER.map((source) => {
    const count = counts.get(source) || 0;
    return { source, count, percent: total > 0 ? Math.round((count / total) * 100) : 0 };
  });

  return { total, breakdown };
}

export interface CtaActivityItem {
  ctaKey: CtaKey;
  count: number;
}

const CTA_DISPLAY_ORDER: CtaKey[] = ["see_available_puppies", "call_now", "im_interested", "puppy_finder"];

export async function getCtaActivity(range: DateRangeKey): Promise<CtaActivityItem[]> {
  const { start, end } = getDateWindow(range);
  const admin = createAdminClient();

  const { data } = await admin
    .from("analytics_events")
    .select("cta_key")
    .eq("event_type", "cta_click")
    .not("cta_key", "is", null)
    .gte("occurred_at", start.toISOString())
    .lt("occurred_at", end.toISOString());

  const counts = new Map<string, number>();
  for (const row of data || []) {
    const key = (row as any).cta_key as string;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return CTA_DISPLAY_ORDER.map((ctaKey) => ({ ctaKey, count: counts.get(ctaKey) || 0 }));
}

export interface OnlineNowPage {
  label: string;
  count: number;
}

export interface OnlineNowData {
  count: number;
  pages: OnlineNowPage[];
}

const FRIENDLY_PATH_LABELS: Record<string, string> = {
  "/": "Home",
  "/puppies": "Available Puppies",
  "/puppy-finder": "Puppy Finder",
  "/favorites": "Favorites",
  "/how-it-works": "How It Works",
  "/faq": "FAQ",
  "/contact": "Contact",
};

/**
 * Always current/real-time - independent of the historical date filter
 * (section 10/14 of the approved spec). A session counts as "online"
 * if it has had activity within ONLINE_NOW_WINDOW_SECONDS (~2 minutes);
 * sessions age out of this automatically as last_activity_at falls
 * behind, no separate cleanup job needed.
 */
export async function getOnlineNow(): Promise<OnlineNowData> {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - ONLINE_NOW_WINDOW_SECONDS * 1000).toISOString();

  const { data: sessions } = await admin
    .from("analytics_sessions")
    .select("current_path, current_puppy_id")
    .gte("last_activity_at", cutoff);

  const rows = sessions || [];
  const count = rows.length;

  const puppyIds = Array.from(new Set(rows.map((r: any) => r.current_puppy_id).filter(Boolean)));
  let puppyNameById = new Map<string, string>();
  if (puppyIds.length > 0) {
    const { data: puppies } = await admin.from("puppies").select("id, name, breed").in("id", puppyIds);
    puppyNameById = new Map((puppies || []).map((p: any) => [p.id, p.name || p.breed || "a puppy"]));
  }

  const pageCounts = new Map<string, number>();
  for (const row of rows as any[]) {
    const label = row.current_puppy_id
      ? puppyNameById.get(row.current_puppy_id) || "a puppy"
      : FRIENDLY_PATH_LABELS[row.current_path || ""] || row.current_path || "Unknown page";
    pageCounts.set(label, (pageCounts.get(label) || 0) + 1);
  }

  const pages = Array.from(pageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, pageCount]) => ({ label, count: pageCount }));

  return { count, pages };
}
