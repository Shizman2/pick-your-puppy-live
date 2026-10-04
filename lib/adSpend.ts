import "server-only";
import { toZonedTime } from "date-fns-tz";
import { createAdminClient } from "./supabase/admin";
import type { AdSpendEntryRow } from "./adSpendTypes";

/** Same business-local timezone used throughout lib/analytics/queries.ts - spend_date is a plain calendar date an admin picks with a <input type="date">, with no timezone concept of its own, so it must be compared against business-LOCAL calendar days, never raw UTC. */
const BUSINESS_TIME_ZONE = "America/New_York";

function businessLocalDateString(d: Date): string {
  const zoned = toZonedTime(d, BUSINESS_TIME_ZONE);
  const year = zoned.getFullYear();
  const month = String(zoned.getMonth() + 1).padStart(2, "0");
  const day = String(zoned.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Sum of amount_cents for entries whose spend_date falls within
 * [start, end) - used by the Business Scorecard's Ad Spend card and by
 * CPL/CAC/ROAS/Profit After Ads.
 *
 * `end` is frequently "right now" (e.g. a "Last 7 Days" window), not
 * midnight - so the last calendar day to include is whichever day
 * contains the instant just before `end`, used as an INCLUSIVE upper
 * bound. A plain `.lt(businessLocalDateString(end))` would wrongly
 * exclude today's own spend any time this function is called later than
 * midnight (confirmed live: a $100 entry logged "today" was silently
 * dropped from every scorecard figure that reads this function). This
 * end-minus-1ms-then-inclusive approach still correctly excludes the
 * boundary day for adjacent comparison windows where `end` is an exact
 * midnight instant (e.g. the previous-period window's end, which equals
 * the current period's start) - same effective behavior as every other
 * [start, end) timestamp comparison in this codebase, just expressed in
 * calendar-day terms for this one date-typed column.
 */
export async function getAdSpendTotal(start: Date, end: Date): Promise<number> {
  const admin = createAdminClient();
  const lastIncludedDay = businessLocalDateString(new Date(end.getTime() - 1));
  const { data } = await admin
    .from("ad_spend_entries")
    .select("amount_cents")
    .gte("spend_date", businessLocalDateString(start))
    .lte("spend_date", lastIncludedDay);

  return (data || []).reduce((sum, row: any) => sum + row.amount_cents, 0);
}

/**
 * Most recent entries, for the management list on Admin -> Analytics.
 * Fails soft (empty list) rather than throwing - if this page is opened
 * before supabase/030_ad_spend_and_revenue_profit_goals.sql has been run,
 * the table won't exist yet, and that shouldn't take down the whole
 * Analytics page over one not-yet-migrated card.
 */
export async function getRecentAdSpendEntries(limit = 20): Promise<AdSpendEntryRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ad_spend_entries")
    .select("*")
    .order("spend_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []) as AdSpendEntryRow[];
}
