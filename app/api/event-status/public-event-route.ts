import { NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Public, read-only feed meant for external embeds (like the
 * iheartpuppy.com homepage widget) that need to show a live countdown
 * without any admin access. Deliberately returns only display-safe
 * fields - never live_show_link, never the private messages, never
 * anything from the admin dashboard's editing fields. If this event
 * isn't published, callers get a clear "not published" state instead
 * of any real countdown data, so the widget can hide itself cleanly.
 *
 * CORS is intentionally open (Access-Control-Allow-Origin: *) since
 * this is meant to be fetched from other domains like iheartpuppy.com.
 * That's safe specifically because nothing sensitive is ever returned
 * here - if that ever changes, this open CORS policy would need to be
 * revisited alongside it.
 */
export async function GET() {
  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("events")
    .select(
      "status, show_at, show_timezone, countdown_headline, event_title, banner_image_url, banner_visible, countdown_visible, registration_link"
    )
    .limit(1)
    .single();

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  };

  if (error || !event || event.status !== "published") {
    return NextResponse.json({ published: false }, { headers });
  }

  return NextResponse.json(
    {
      published: true,
      showAt: event.show_at,
      showTimezone: event.show_timezone,
      headline: event.countdown_headline,
      eventTitle: event.event_title,
      bannerImageUrl: event.banner_image_url,
      bannerVisible: event.banner_visible,
      countdownVisible: event.countdown_visible,
      registrationLink: event.registration_link,
    },
    { headers }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  });
}
