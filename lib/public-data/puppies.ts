import "server-only";
import { createAdminClient } from "../supabase/admin";
import { displayBadgeTag, isReservedStatus, type PuppyRow } from "../puppyTypes";
import type { HomepagePuppy, SpotlightPuppy } from "./homepage";
import { getFavoriteCounts } from "../favorites";

/** Full list for the /puppies grid — same show_on_website filter as the public API. Status (including "sold") only affects the badge, not inclusion. */
export async function getAllVisiblePuppies(): Promise<PuppyRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("puppies")
    .select("*")
    .eq("show_on_website", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as PuppyRow[];
}

/** True when this row is publicly shown as the Special Opportunity. Sold, On Hold and Sale Pending puppies never are - a special price implies the puppy can be bought now. */
export function isActiveSpotlight(row: PuppyRow): boolean {
  return (
    !!row.is_spotlight &&
    !!row.spotlight_price_cents &&
    row.show_on_website &&
    row.status !== "sold" &&
    !isReservedStatus(row.status)
  );
}

/**
 * Active inventory for /puppies: every visible puppy except sold ones. The
 * active Special Opportunity (at most one) is split out of the normal cards
 * so it is never shown twice; turning it off simply puts it back here.
 */
export async function getActivePuppiesForCards(): Promise<{ puppies: HomepagePuppy[]; spotlight: SpotlightPuppy | null }> {
  const rows = (await getAllVisiblePuppies()).filter((r) => r.status !== "sold");
  const favoritesCounts = await getFavoriteCounts(rows.map((r) => r.id));
  const spotlightRow = rows.find(isActiveSpotlight) || null;
  const puppies = rows
    .filter((row) => row !== spotlightRow)
    .map((row) => mapPuppyRowToCard(row, favoritesCounts[row.id] || 0));
  const spotlight: SpotlightPuppy | null = spotlightRow
    ? {
        ...mapPuppyRowToCard(spotlightRow, favoritesCounts[spotlightRow.id] || 0),
        specialPriceCents: spotlightRow.spotlight_price_cents as number,
        headline: spotlightRow.spotlight_headline?.trim() || null,
        message: spotlightRow.spotlight_message?.trim() || null,
      }
    : null;
  return { puppies, spotlight };
}

export const RECENTLY_SOLD_LIMIT = 6;

/** "Recently Found Their Homes" on /puppies: visible sold puppies, most recently sold first. */
export async function getRecentlySoldPuppiesForCards(): Promise<HomepagePuppy[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("puppies")
    .select("*")
    .eq("show_on_website", true)
    .eq("status", "sold")
    .order("sold_at", { ascending: false, nullsFirst: false })
    .limit(RECENTLY_SOLD_LIMIT);

  if (error || !data) return [];
  return (data as PuppyRow[]).map((row) => mapPuppyRowToCard(row));
}

export function mapPuppyRowToCard(row: PuppyRow, favoritesCount = 0): HomepagePuppy {
  let ageWeeks: number | null = null;
  if (row.date_of_birth) {
    const dob = new Date(`${row.date_of_birth}T00:00:00`);
    ageWeeks = Math.max(0, Math.floor((Date.now() - dob.getTime()) / (7 * 24 * 60 * 60 * 1000)));
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
    favoritesCount,
    location: row.location || null,
    badgeTag: displayBadgeTag(row.badge_tag, row.created_at),
    soldAt: row.sold_at ?? null,
  };
}

/** Single puppy for the /puppies/[slug] detail page. */
export async function getPuppyBySlug(slug: string): Promise<PuppyRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("puppies")
    .select("*")
    .eq("slug", slug)
    .eq("show_on_website", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as PuppyRow;
}

/**
 * Real puppy-detail views in the rolling last 24 hours, from the existing
 * first-party analytics (analytics_events, event_type "puppy_view"). Those
 * rows already exclude bots, excluded devices and non-production hosts, and
 * repeat views are capped at one per visitor per puppy per 30 minutes - so
 * this is a true count, never padded. Returns 0 on any error.
 */
export async function getPuppyViewsLast24h(puppyId: string): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "puppy_view")
    .eq("puppy_id", puppyId)
    .gte("occurred_at", since);
  if (error) return 0;
  return count || 0;
}
