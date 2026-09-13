"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../lib/supabase/admin";
import { FAVORITES_VISITOR_COOKIE, FAVORITES_VISITOR_COOKIE_MAX_AGE } from "../../lib/favorites";

export type ToggleFavoriteResult = { success: true; isFavorited: boolean } | { success: false; error: string };

/**
 * Toggle, not "add" - clicking an already-favorited puppy un-favorites
 * it. This is what makes the public count immune to a single visitor
 * inflating it by repeated clicking: their contribution is always
 * exactly 0 or 1 active row, enforced by the unique(puppy_id, visitor_id)
 * constraint, never a growing count of click events.
 */
export async function toggleFavorite(puppyId: string): Promise<ToggleFavoriteResult> {
  const store = cookies();
  const existingVisitorId = store.get(FAVORITES_VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId || crypto.randomUUID();

  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("puppy_favorites")
    .select("id, is_active, favorited_at")
    .eq("puppy_id", puppyId)
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (fetchError) return { success: false, error: fetchError.message };

  const nextActive = !existing?.is_active;
  const now = new Date().toISOString();

  const { error } = await admin.from("puppy_favorites").upsert(
    {
      puppy_id: puppyId,
      visitor_id: visitorId,
      is_active: nextActive,
      // Re-favoriting bumps favorited_at to now (so it surfaces in a
      // "recent favorites" feed again); unfavoriting deliberately keeps
      // the existing favorited_at rather than clearing it - it's history,
      // not a live status field.
      favorited_at: nextActive ? now : existing?.favorited_at ?? now,
      unfavorited_at: nextActive ? null : now,
      updated_at: now,
    },
    { onConflict: "puppy_id,visitor_id" }
  );

  if (error) return { success: false, error: error.message };

  if (!existingVisitorId) {
    store.set(FAVORITES_VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: FAVORITES_VISITOR_COOKIE_MAX_AGE,
      path: "/",
    });
  }

  // These pages bake in the (non-personalized) favorite count server-
  // side, so it needs invalidating; the per-visitor "is this favorited"
  // state is hydrated client-side and doesn't depend on this.
  revalidatePath("/");
  revalidatePath("/puppies");
  revalidatePath("/puppies/[slug]", "page");
  revalidatePath("/favorites");

  return { success: true, isFavorited: nextActive };
}

/** Read-only check used to hydrate a FavoriteButton's initial state client-side. */
export async function isPuppyFavorited(puppyId: string): Promise<boolean> {
  const visitorId = cookies().get(FAVORITES_VISITOR_COOKIE)?.value;
  if (!visitorId) return false;

  const admin = createAdminClient();
  const { data } = await admin
    .from("puppy_favorites")
    .select("is_active")
    .eq("puppy_id", puppyId)
    .eq("visitor_id", visitorId)
    .maybeSingle();

  return Boolean(data?.is_active);
}
