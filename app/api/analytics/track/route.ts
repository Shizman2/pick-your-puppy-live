import { NextRequest, NextResponse } from "next/server";
import { recordAnalyticsEvent } from "../../../../lib/analytics/ingest";
import { ANALYTICS_VISITOR_COOKIE, ANALYTICS_SESSION_COOKIE } from "../../../../lib/analytics/constants";

export const dynamic = "force-dynamic";

/**
 * Fired client-side by AnalyticsTracker / PuppyViewTracker / trackCta
 * (see lib/analytics/trackClient.ts), via navigator.sendBeacon with a
 * fetch(keepalive) fallback. Always returns 204 with no body, whether
 * or not anything was actually recorded (excluded device, bot traffic,
 * a malformed body, and genuine failures all look identical to the
 * caller - the client never reads this response, so there's nothing
 * for it to react to differently, and never revealing which case
 * happened avoids giving any signal to something probing this endpoint).
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const eventType = body.eventType;
  const path = typeof body.path === "string" ? body.path : null;
  const validEventType = eventType === "page_view" || eventType === "puppy_view" || eventType === "cta_click";

  if (!validEventType || !path) {
    return new NextResponse(null, { status: 204 });
  }

  const ctaKey = typeof body.ctaKey === "string" ? body.ctaKey : null;
  const validCtaKey =
    ctaKey === null || ctaKey === "call_now" || ctaKey === "im_interested" || ctaKey === "puppy_finder" || ctaKey === "see_available_puppies";

  let result: Awaited<ReturnType<typeof recordAnalyticsEvent>> = { recorded: false };
  try {
    result = await recordAnalyticsEvent({
      eventType,
      path,
      puppyId: typeof body.puppyId === "string" ? body.puppyId : null,
      ctaKey: validCtaKey ? (ctaKey as any) : null,
      referrer: typeof body.referrer === "string" ? body.referrer : null,
      utmSource: typeof body.utmSource === "string" ? body.utmSource : null,
      utmMedium: typeof body.utmMedium === "string" ? body.utmMedium : null,
      utmCampaign: typeof body.utmCampaign === "string" ? body.utmCampaign : null,
      utmContent: typeof body.utmContent === "string" ? body.utmContent : null,
      utmTerm: typeof body.utmTerm === "string" ? body.utmTerm : null,
    });
  } catch (err) {
    // Defense in depth: recordAnalyticsEvent already handles Supabase's
    // own {error} responses (and logs them - see lib/analytics/ingest.ts),
    // but a hard exception here (e.g. a missing/misconfigured env var
    // breaking createAdminClient()) must never surface to the client or
    // crash the route - it's still a best-effort beacon endpoint.
    console.error("[analytics] unexpected error in /api/analytics/track:", err instanceof Error ? err.message : err);
  }

  const response = new NextResponse(null, { status: 204 });

  if (result.visitorCookie) {
    response.cookies.set(ANALYTICS_VISITOR_COOKIE, result.visitorCookie.value, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: result.visitorCookie.maxAge,
      path: "/",
    });
  }
  if (result.sessionCookie) {
    response.cookies.set(ANALYTICS_SESSION_COOKIE, result.sessionCookie.value, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: result.sessionCookie.maxAge,
      path: "/",
    });
  }

  return response;
}
