import "server-only";
import { createAdminClient } from "../supabase/admin";
import type { PuppyRow } from "../puppyTypes";

export interface HomepagePuppy {
  id: string;
  slug: string;
  name: string;
  breed: string;
  priceCents: number;
  salePriceCents: number | null;
  gender: "male" | "female";
  ageWeeks: number | null;
  status: PuppyRow["status"];
  photoUrl: string;
}

/**
 * Same filter/order as /api/public-puppies (show_on_website = true,
 * ordered by display_order then name), trimmed to the fields the
 * homepage's featured strip actually renders, and capped at 4 to
 * match the current live site.
 */
export async function getFeaturedPuppies(): Promise<HomepagePuppy[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("puppies")
    .select(
      "id, name, slug, breed, price_cents, sale_price_cents, gender, date_of_birth, status, photo_urls, display_order"
    )
    .eq("show_on_website", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true })
    .limit(4);

  if (error || !data) return [];

  return data.map((row) => {
    let ageWeeks: number | null = null;
    if (row.date_of_birth) {
      const dob = new Date(`${row.date_of_birth}T00:00:00`);
      ageWeeks = Math.max(
        0,
        Math.floor((Date.now() - dob.getTime()) / (7 * 24 * 60 * 60 * 1000))
      );
    }
    const photos: string[] = Array.isArray(row.photo_urls) ? row.photo_urls.filter(Boolean) : [];

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      breed: row.breed,
      priceCents: row.price_cents || 0,
      salePriceCents: row.sale_price_cents || null,
      gender: row.gender,
      ageWeeks,
      status: row.status,
      photoUrl: photos[0] || "",
    };
  });
}

export interface HomepageEventData {
  published: boolean;
  bannerVisible: boolean;
  bannerImageUrl: string | null;
  countdownVisible: boolean;
  eventTitle: string | null;
  showAt: string | null;
  registrationLink: string | null;
}

/**
 * Same fields/logic as /api/public-event, called directly instead of
 * over HTTP so the homepage already knows whether to show the banner
 * and/or countdown before any HTML reaches the browser - this is what
 * removes the flash/flicker on first load.
 */
export async function getHomepageEventData(): Promise<HomepageEventData> {
  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("events")
    .select(
      "show_at, event_title, banner_image_url, banner_visible, countdown_visible, registration_link"
    )
    .limit(1)
    .maybeSingle();

  if (error || !event) {
    return {
      published: false,
      bannerVisible: false,
      bannerImageUrl: null,
      countdownVisible: false,
      eventTitle: null,
      showAt: null,
      registrationLink: null,
    };
  }

  return {
    published: true,
    bannerVisible: !!event.banner_visible,
    bannerImageUrl: event.banner_image_url,
    countdownVisible: !!event.countdown_visible,
    eventTitle: event.event_title,
    showAt: event.show_at,
    registrationLink: event.registration_link,
  };
}
