import "server-only";
import { createAdminClient } from "../supabase/admin";
import { marketingBadge, type PuppyRow } from "../puppyTypes";
import type { HomepagePuppy } from "./homepage";
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

/** Active inventory for the /puppies grid: every visible puppy except sold ones, as cards. */
export async function getActivePuppiesForCards(): Promise<HomepagePuppy[]> {
  const rows = (await getAllVisiblePuppies()).filter((r) => r.status !== "sold");
  const favoritesCounts = await getFavoriteCounts(rows.map((r) => r.id));
  return rows.map((row) => mapPuppyRowToCard(row, favoritesCounts[row.id] || 0));
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
    badgeTag: marketingBadge(row.badge_tag),
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
