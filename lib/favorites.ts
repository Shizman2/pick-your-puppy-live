import "server-only";
import { cookies } from "next/headers";
import { createAdminClient } from "./supabase/admin";
import type { PuppyGender, PuppyStatus } from "./puppyTypes";

export const FAVORITES_VISITOR_COOKIE = "pp_visitor";
export const FAVORITES_VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 years

/** Read-only - never mints a new id. Use toggleFavorite (a Server Action) to create one. */
export function getVisitorIdReadOnly(): string | null {
  return cookies().get(FAVORITES_VISITOR_COOKIE)?.value || null;
}

/**
 * Grouped count query - one round trip for an entire page of cards,
 * not one query per card. Counts are non-personalized (same for every
 * visitor), so it's safe for this to run inside an ISR-cached page.
 */
export async function getFavoriteCounts(puppyIds: string[]): Promise<Record<string, number>> {
  if (puppyIds.length === 0) return {};
  const admin = createAdminClient();
  const { data } = await admin
    .from("puppy_favorites")
    .select("puppy_id")
    .eq("is_active", true)
    .in("puppy_id", puppyIds);

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.puppy_id] = (counts[row.puppy_id] || 0) + 1;
  }
  return counts;
}

export async function getFavoriteCount(puppyId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("puppy_favorites")
    .select("id", { count: "exact", head: true })
    .eq("puppy_id", puppyId)
    .eq("is_active", true);
  return count || 0;
}

export interface VisitorFavoriteItem {
  id: string;
  puppyId: string;
  favoritedAt: string;
  puppy: {
    id: string;
    slug: string;
    name: string;
    breed: string;
    gender: PuppyGender;
    priceCents: number;
    salePriceCents: number | null;
    status: PuppyStatus;
    photoUrl: string;
  };
}

/** Everything the current visitor (identified by their cookie, if any) currently has favorited - for the /favorites page. */
export async function getVisitorFavorites(): Promise<VisitorFavoriteItem[]> {
  const visitorId = getVisitorIdReadOnly();
  if (!visitorId) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("puppy_favorites")
    .select("id, puppy_id, favorited_at, puppies(id, slug, name, breed, gender, price_cents, sale_price_cents, status, photo_urls)")
    .eq("visitor_id", visitorId)
    .eq("is_active", true)
    .order("favorited_at", { ascending: false });

  const items: VisitorFavoriteItem[] = [];
  for (const row of (data || []) as any[]) {
    const puppy = row.puppies;
    if (!puppy) continue; // puppy row was hard-deleted - nothing sensible to show
    items.push({
      id: row.id,
      puppyId: row.puppy_id,
      favoritedAt: row.favorited_at,
      puppy: {
        id: puppy.id,
        slug: puppy.slug,
        name: puppy.name,
        breed: puppy.breed,
        gender: puppy.gender,
        priceCents: puppy.price_cents,
        salePriceCents: puppy.sale_price_cents,
        status: puppy.status,
        photoUrl: (puppy.photo_urls || [])[0] || "",
      },
    });
  }
  return items;
}

/**
 * Called once a previously-anonymous visitor becomes identifiable (any
 * inquiry form submission - see app/api/inquire/route.ts). Only
 * backfills rows that aren't already linked, so this is safe to call
 * on every submission without overwriting an earlier, possibly
 * different, contact link.
 */
export async function linkFavoritesToContact(contactId: string): Promise<void> {
  const visitorId = getVisitorIdReadOnly();
  if (!visitorId) return;

  const admin = createAdminClient();
  await admin
    .from("puppy_favorites")
    .update({ contact_id: contactId })
    .eq("visitor_id", visitorId)
    .is("contact_id", null);
}
