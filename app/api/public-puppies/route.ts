import { NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Public feed for the live IHeartPuppy.com website. Only exposes the
 * fields the site actually needs to display listings - nothing
 * admin-only. CORS is open since this is meant to be fetched
 * cross-domain from iheartpuppy.com, same pattern as /api/public-event.
 */
export async function GET() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("puppies")
    .select(
      "id, name, slug, breed, price_cents, gender, date_of_birth, size, status, badge_tag, description, photo_urls, vet_checked, vaccinated, delivery_available, is_featured, display_order"
    )
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  };

  if (error) {
    return NextResponse.json({ puppies: [] }, { headers });
  }

  return NextResponse.json({ puppies: data || [] }, { headers });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  });
}
