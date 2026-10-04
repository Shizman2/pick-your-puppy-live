import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isNonProductionEnvironmentServer } from "../../../../lib/analytics/environment";
import { isLikelyBot } from "../../../../lib/analytics/botDetection";
import { LANDING_ALLOWED_ORIGINS, MAX_LANDING_VISITOR_ID_LENGTH } from "../../../../lib/analytics/constants";

export const dynamic = "force-dynamic";

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

  // Hand-rolled upsert (select, then insert-or-update), not a single
  // .upsert() call: utm_*/fbclid are first-touch-only and must never be
  // overwritten by a later visit from the same landing visitor id - see
  // the schema comment in supabase/031_landing_page_attribution.sql.
  const { data: existing } = await admin.from("landing_visitors").select("id").eq("id", landingVisitorId).maybeSingle();

  if (!existing) {
    const { error } = await admin.from("landing_visitors").insert({
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
    if (error) {
      console.error("[analytics] failed to insert landing_visitors:", error.message, error.details || "");
      return new NextResponse(null, { status: 204, headers });
    }
  } else {
    const { error } = await admin.from("landing_visitors").update({ last_seen_at: nowIso }).eq("id", landingVisitorId);
    if (error) console.error("[analytics] failed to update landing_visitors.last_seen_at:", error.message);
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

  return new NextResponse(null, { status: 204, headers });
}
