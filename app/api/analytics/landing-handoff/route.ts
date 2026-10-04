import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { resolveOrCreateVisitor } from "../../../../lib/analytics/ingest";
import { isNonProductionEnvironmentServer } from "../../../../lib/analytics/environment";
import { isLikelyBot } from "../../../../lib/analytics/botDetection";
import { ANALYTICS_VISITOR_COOKIE, ANALYTICS_EXCLUSION_COOKIE, MAX_LANDING_VISITOR_ID_LENGTH } from "../../../../lib/analytics/constants";

export const dynamic = "force-dynamic";

/**
 * Same-origin receiver, called once by components/public/LandingHandoffCapture.tsx
 * when a visitor arrives with ?pp_lv=<landingVisitorId> from the GHL
 * /start page. Resolves (or mints) this browser's normal website
 * analytics_visitors row and associates it with that landing visitor -
 * first-write-wins, so a second handoff on an already-associated
 * visitor is a no-op rather than re-attributing them.
 */
export async function POST(request: NextRequest) {
  if (isNonProductionEnvironmentServer(request.headers.get("host"))) {
    return new NextResponse(null, { status: 204 });
  }
  if (request.cookies.get(ANALYTICS_EXCLUSION_COOKIE)?.value === "true") {
    return new NextResponse(null, { status: 204 });
  }
  if (isLikelyBot(request.headers.get("user-agent"))) {
    return new NextResponse(null, { status: 204 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const landingVisitorId = typeof body.landingVisitorId === "string" ? body.landingVisitorId.trim() : "";
  if (!landingVisitorId || landingVisitorId.length > MAX_LANDING_VISITOR_ID_LENGTH) {
    return new NextResponse(null, { status: 204 });
  }

  const resolution = await resolveOrCreateVisitor(request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value || null);
  if (!resolution.ok) {
    return new NextResponse(null, { status: 204 });
  }

  const admin = createAdminClient();
  const { data: existingRow } = await admin
    .from("analytics_visitors")
    .select("landing_visitor_id")
    .eq("id", resolution.visitorId)
    .maybeSingle();

  if (existingRow && !existingRow.landing_visitor_id) {
    const { error } = await admin
      .from("analytics_visitors")
      .update({ landing_visitor_id: landingVisitorId })
      .eq("id", resolution.visitorId);
    if (error) console.error("[analytics] failed to associate landing_visitor_id:", error.message);
  }

  const response = new NextResponse(null, { status: 204 });
  if (resolution.visitorCookie) {
    response.cookies.set(ANALYTICS_VISITOR_COOKIE, resolution.visitorCookie.value, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: resolution.visitorCookie.maxAge,
      path: "/",
    });
  }
  return response;
}
