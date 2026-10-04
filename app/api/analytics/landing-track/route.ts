import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isNonProductionEnvironmentServer } from "../../../../lib/analytics/environment";
import { isLikelyBot } from "../../../../lib/analytics/botDetection";
import { LANDING_ALLOWED_ORIGINS, LANDING_TEST_ID_PREFIX, MAX_LANDING_VISITOR_ID_LENGTH } from "../../../../lib/analytics/constants";
import { sendPushToAdmins } from "../../../../lib/push";
import type { PushNotificationPayload } from "../../../../lib/pushTypes";

export const dynamic = "force-dynamic";

/** Only included when the data actually exists - never shown as "Unknown"/blank. */
function buildFunnelVisitorNotification(utmSource: string | null, utmCampaign: string | null): PushNotificationPayload {
  const lines = ["Someone just visited your Puppy Plugs funnel."];
  if (utmSource) lines.push(`Source: ${utmSource}`);
  if (utmCampaign) lines.push(`Campaign: ${utmCampaign}`);
  return {
    title: "New Funnel Visitor",
    body: lines.join("\n"),
    url: "/admin/analytics",
    tag: "funnel_visitor",
  };
}

/**
 * Cross-origin receiver for the GHL /start landing page
 * (pickyourpuppylive.com) - every other analytics endpoint on this site
 * is same-origin only, so this is the one place that needs real CORS
 * handling. Only the exact allowlisted origin(s) get an
 * Access-Control-Allow-Origin header at all; an unrecognized Origin gets
 * neither CORS headers nor a database write - this endpoint is public,
 * so Origin-checking is the only gate it has.
 */
function corsHeadersFor(origin: string | null): HeadersInit | undefined {
  if (!origin || !LANDING_ALLOWED_ORIGINS.includes(origin)) return undefined;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export async function OPTIONS(request: NextRequest) {
  const headers = corsHeadersFor(request.headers.get("origin"));
  return new NextResponse(null, { status: 204, headers });
}

/**
 * Fired once per /start page load by the GHL tracking snippet. Always
 * returns 204 with no body (same "never reveal which case happened"
 * posture as /api/analytics/track) - the exceptions are an unrecognized
 * Origin, which gets no CORS headers at all so the calling page can
 * never read the response either way.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeadersFor(origin);

  if (!headers) {
    return new NextResponse(null, { status: 204 });
  }

  if (isNonProductionEnvironmentServer(request.headers.get("host"))) {
    return new NextResponse(null, { status: 204, headers });
  }
  if (isLikelyBot(request.headers.get("user-agent"))) {
    return new NextResponse(null, { status: 204, headers });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204, headers });
  }

  const landingVisitorId = typeof body.landingVisitorId === "string" ? body.landingVisitorId.trim() : "";
  if (!landingVisitorId || landingVisitorId.length > MAX_LANDING_VISITOR_ID_LENGTH) {
    return new NextResponse(null, { status: 204, headers });
  }

  const landingSessionId =
    typeof body.landingSessionId === "string" ? body.landingSessionId.trim().slice(0, 128) || null : null;
  const path = typeof body.path === "string" && body.path.trim() ? body.path.trim().slice(0, 200) : "/start";
  const utmSource = typeof body.utmSource === "string" ? body.utmSource.slice(0, 200) : null;
  const utmMedium = typeof body.utmMedium === "string" ? body.utmMedium.slice(0, 200) : null;
  const utmCampaign = typeof body.utmCampaign === "string" ? body.utmCampaign.slice(0, 200) : null;
  const utmContent = typeof body.utmContent === "string" ? body.utmContent.slice(0, 200) : null;
  const utmTerm = typeof body.utmTerm === "string" ? body.utmTerm.slice(0, 200) : null;
  const fbclid = typeof body.fbclid === "string" ? body.fbclid.slice(0, 200) : null;

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  // Insert-first, not select-then-insert: two near-simultaneous requests
  // for the SAME brand-new landing visitor id (e.g. the tracking beacon
  // firing twice, or a retry) must never both decide "this is new" - the
  // unique constraint on landing_visitors.id is what actually serializes
  // that decision. Whichever request's insert succeeds is the one true
  // "new visitor" (and the only one that may trigger a push below); the
  // other gets a 23505 (unique_violation) and falls back to a normal
  // last_seen_at update, exactly like any other returning visitor. A
  // select-then-insert here would have a race window where both requests
  // see "no existing row" and both insert - impossible with this
  // ordering. utm_*/fbclid stay first-touch-only either way: they're
  // only ever written in the insert branch, never the update branch -
  // see the schema comment in supabase/031_landing_page_attribution.sql.
  const { error: insertError } = await admin.from("landing_visitors").insert({
    id: landingVisitorId,
    first_seen_at: nowIso,
    last_seen_at: nowIso,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
    fbclid,
  });

  let isNewUniqueVisitor = false;

  if (!insertError) {
    isNewUniqueVisitor = true;
  } else if (insertError.code === "23505") {
    // Already exists - a genuine returning visit, or the losing side of
    // the race above. Either way, never a reason to notify again.
    const { error: updateError } = await admin.from("landing_visitors").update({ last_seen_at: nowIso }).eq("id", landingVisitorId);
    if (updateError) console.error("[analytics] failed to update landing_visitors.last_seen_at:", updateError.message);
  } else {
    console.error("[analytics] failed to insert landing_visitors:", insertError.message, insertError.details || "");
    return new NextResponse(null, { status: 204, headers });
  }

  const { error: eventError } = await admin.from("landing_page_events").insert({
    landing_visitor_id: landingVisitorId,
    landing_session_id: landingSessionId,
    path,
    occurred_at: nowIso,
  });
  if (eventError) {
    console.error("[analytics] failed to insert landing_page_events:", eventError.message, eventError.details || "");
  }

  // Admin push notification - fires at most once per unique landing
  // visitor (only on the branch that just inserted a brand-new row
  // above), never on a repeat page view, refresh, or losing race. Never
  // allowed to affect this response either way - tracking has already
  // fully succeeded by this point regardless of whether the push does.
  // Skipped for ?pp_test=1 verification visits (id prefixed "test_" -
  // see the GHL snippet) for the same reason those are excluded from
  // every Funnel Page Visitors count: verifying the live script should
  // never alert a real admin.
  if (isNewUniqueVisitor && !landingVisitorId.startsWith(LANDING_TEST_ID_PREFIX)) {
    try {
      await sendPushToAdmins("funnel_visitor", buildFunnelVisitorNotification(utmSource, utmCampaign));
    } catch (err) {
      console.error("[analytics] funnel visitor push failed:", err);
    }
  }

  return new NextResponse(null, { status: 204, headers });
}
