import "server-only";
import { createAdminClient } from "../supabase/admin";
import type { PuppyRow } from "../puppyTypes";
import type { HomepagePuppy } from "./homepage";

/** Full list for the /puppies grid — same show_on_website filter as the public API. */
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

/** Same list, mapped down to the lighter card shape used by both the grid and homepage. */
export async function getAllVisiblePuppiesForCards(): Promise<HomepagePuppy[]> {
  const rows = await getAllVisiblePuppies();
  return rows.map(mapPuppyRowToCard);
}

export function mapPuppyRowToCard(row: PuppyRow): HomepagePuppy {
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
