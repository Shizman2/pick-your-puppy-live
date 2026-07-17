import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { getEventState } from "../../../lib/eventTime";

export const dynamic = "force-dynamic";

/**
 * The slug comes from the requesting page's own URL (see
 * ShowPageClient's recheck call), not a hardcoded value - this keeps
 * the check consistent with the public page's own slug-matching
 * privacy mechanism, and means regenerating the slug never breaks this.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.status !== "published") {
    return NextResponse.json({ error: "Event not published" }, { status: 404 });
  }

  const now = new Date();
  const state = getEventState(
    now,
    new Date(event.countdown_starts_at),
    new Date(event.show_at)
  );

  return NextResponse.json(
    {
      state,
      serverTime: now.toISOString(),
      showAt: event.show_at,
      liveShowLink: state === "live" ? event.live_show_link : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
