import "server-only";
import { cookies, headers } from "next/headers";
import { createAdminClient } from "../supabase/admin";
import { classifyTrafficSource } from "./classifySource";
import { isLikelyBot } from "./botDetection";
import {
  ANALYTICS_VISITOR_COOKIE,
  ANALYTICS_SESSION_COOKIE,
  ANALYTICS_EXCLUSION_COOKIE,
  VISITOR_COOKIE_MAX_AGE_SECONDS,
  SESSION_TIMEOUT_SECONDS,
  PUPPY_VIEW_DEDUP_SECONDS,
  type AnalyticsEventType,
  type CtaKey,
} from "./constants";

export interface TrackEventInput {
  eventType: AnalyticsEventType;
  path: string;
  puppyId?: string | null;
  ctaKey?: CtaKey | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
}

export interface TrackResult {
  recorded: boolean;
  visitorCookie?: { value: string; maxAge: number };
  sessionCookie?: { value: string; maxAge: number };
}

/**
 * Core ingestion logic for POST /api/analytics/track. Called only from
 * that route handler (never from a client component directly - this
 * file is server-only and uses the service-role Supabase client).
 *
 * Ordering matters here and is deliberate:
 *   1. Excluded device -> stop immediately. No visitor row, no session
 *      row, no event row. This is what makes device exclusion prevent
 *      recording at the source rather than merely hiding data later.
 *   2. Obvious bot/crawler -> same full stop.
 *   3. Resolve or mint the visitor (2-year cookie).
 *   4. Resolve or start the session (30-minute inactivity timeout).
 *   5. For puppy_view specifically, check the repeat-protection cooldown.
 *   6. Insert the event row(s).
 */
export async function recordAnalyticsEvent(input: TrackEventInput): Promise<TrackResult> {
  const store = cookies();

  if (store.get(ANALYTICS_EXCLUSION_COOKIE)?.value === "true") {
    return { recorded: false };
  }

  const userAgent = headers().get("user-agent");
  if (isLikelyBot(userAgent)) {
    return { recorded: false };
  }

  const admin = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();

  // --- Visitor ---
  let visitorId = store.get(ANALYTICS_VISITOR_COOKIE)?.value || null;
  let visitorCookie: TrackResult["visitorCookie"];

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    const { error } = await admin.from("analytics_visitors").insert({
      id: visitorId,
      first_seen_at: nowIso,
      last_seen_at: nowIso,
    });
    if (error) {
      console.error("[analytics] failed to insert analytics_visitors:", error.message, error.details || "");
      return { recorded: false };
    }
    visitorCookie = { value: visitorId, maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS };
  } else {
    // Single-row update by primary key - cheap. Best-effort: a failure
    // here shouldn't block the rest of the event from being recorded.
    const { error } = await admin.from("analytics_visitors").update({ last_seen_at: nowIso }).eq("id", visitorId);
    if (error) console.error("[analytics] failed to update analytics_visitors.last_seen_at:", error.message);
  }

  // --- Session ---
  // The session cookie's own sliding maxAge (reset below on every
  // event) IS the 30-minute inactivity window: once 30 minutes pass
  // with no activity, the browser simply stops sending this cookie, so
  // this code always sees "no session cookie" for a genuinely stale
  // session rather than needing to compare last_activity_at itself.
  let sessionId = store.get(ANALYTICS_SESSION_COOKIE)?.value || null;

  if (sessionId) {
    // Confirm the row still exists and actually belongs to this visitor
    // before trusting a client-supplied cookie value.
    const { data: existing, error } = await admin
      .from("analytics_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("visitor_id", visitorId)
      .maybeSingle();
    if (error) console.error("[analytics] failed to look up analytics_sessions:", error.message);
    if (!existing) sessionId = null;
  }

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    const trafficSource = classifyTrafficSource(input.referrer || null, input.utmSource || null);
    const { error } = await admin.from("analytics_sessions").insert({
      id: sessionId,
      visitor_id: visitorId,
      started_at: nowIso,
      last_activity_at: nowIso,
      entry_path: input.path,
      current_path: input.path,
      current_puppy_id: input.eventType === "puppy_view" ? input.puppyId || null : null,
      referrer: input.referrer || null,
      traffic_source: trafficSource,
      utm_source: input.utmSource || null,
      utm_medium: input.utmMedium || null,
      utm_campaign: input.utmCampaign || null,
      utm_content: input.utmContent || null,
      utm_term: input.utmTerm || null,
    });
    if (error) {
      console.error("[analytics] failed to insert analytics_sessions:", error.message, error.details || "");
      return { recorded: false };
    }
  } else {
    const updates: Record<string, unknown> = { last_activity_at: nowIso };
    // A cta_click doesn't represent navigation, so it never changes
    // current_path/current_puppy_id - only page_view/puppy_view do.
    if (input.eventType === "page_view" || input.eventType === "puppy_view") {
      updates.current_path = input.path;
      updates.current_puppy_id = input.eventType === "puppy_view" ? input.puppyId || null : null;
    }
    const { error } = await admin.from("analytics_sessions").update(updates).eq("id", sessionId);
    if (error) console.error("[analytics] failed to update analytics_sessions:", error.message);
  }

  // --- Puppy-view repeat protection ---
  // Exact rule: a puppy_view event is recorded at most once per
  // (visitor, puppy) pair per rolling 30-minute window. Rapid
  // refreshing within that window never produces additional puppy_view
  // rows; returning to the same puppy again after the window has
  // elapsed produces a new one, so it is a cooldown, not a permanent
  // dedup. This never affects page_view rows - those are recorded for
  // every single page load, refresh included, unconditionally.
  let shouldRecordPuppyView = input.eventType === "puppy_view" && Boolean(input.puppyId);
  if (shouldRecordPuppyView) {
    const cutoffIso = new Date(now.getTime() - PUPPY_VIEW_DEDUP_SECONDS * 1000).toISOString();
    const { data: recentView, error } = await admin
      .from("analytics_events")
      .select("id")
      .eq("event_type", "puppy_view")
      .eq("visitor_id", visitorId)
      .eq("puppy_id", input.puppyId as string)
      .gte("occurred_at", cutoffIso)
      .limit(1)
      .maybeSingle();
    if (error) console.error("[analytics] failed to check puppy_view dedup:", error.message);
    if (recentView) shouldRecordPuppyView = false;
  }

  // --- Event row(s) ---
  const rows: Record<string, unknown>[] = [];

  if (input.eventType === "cta_click") {
    rows.push({
      visitor_id: visitorId,
      session_id: sessionId,
      event_type: "cta_click",
      path: input.path,
      puppy_id: input.puppyId || null,
      cta_key: input.ctaKey || null,
      occurred_at: nowIso,
    });
  } else {
    // A puppy-page load always counts toward the general Page Views
    // total (refreshing legitimately adds raw page views, per the
    // approved spec) - it only ADDITIONALLY becomes a puppy_view row
    // when the cooldown check above allows it.
    rows.push({
      visitor_id: visitorId,
      session_id: sessionId,
      event_type: "page_view",
      path: input.path,
      puppy_id: null,
      cta_key: null,
      occurred_at: nowIso,
    });
    if (shouldRecordPuppyView) {
      rows.push({
        visitor_id: visitorId,
        session_id: sessionId,
        event_type: "puppy_view",
        path: input.path,
        puppy_id: input.puppyId,
        cta_key: null,
        occurred_at: nowIso,
      });
    }
  }

  const { error: insertError } = await admin.from("analytics_events").insert(rows);
  if (insertError) {
    console.error("[analytics] failed to insert analytics_events:", insertError.message, insertError.details || "");
    return { recorded: false };
  }

  return {
    recorded: true,
    visitorCookie,
    sessionCookie: { value: sessionId, maxAge: SESSION_TIMEOUT_SECONDS },
  };
}
