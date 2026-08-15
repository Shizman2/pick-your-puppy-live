import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { MediaPlacementWithAsset, PageType, SlotId } from "./mediaTypes";

/**
 * Returns the eligible, published placement(s) for a given page/slot,
 * already filtered by schedule and sorted by priority. Device visibility
 * (mobile_visible/desktop_visible) is NOT filtered here - it's applied
 * with CSS at render time so a single server response covers both, per
 * the "don't detect device server-side" rule.
 *
 * If previewToken is provided and matches a placement for this exact
 * page/slot, that placement is shown ALONE regardless of its status or
 * schedule - this is how admin preview renders a draft inside the real
 * page. An invalid/expired/mismatched token has no effect and normal
 * published placements are returned instead.
 */
export async function getPlacementsForSlot(
  pageType: PageType,
  slot: SlotId,
  pageIdentifier?: string | null,
  previewToken?: string | null
): Promise<MediaPlacementWithAsset[]> {
  if (previewToken) {
    const preview = await getPlacementByPreviewTokenForSlot(pageType, slot, pageIdentifier, previewToken);
    if (preview) return [preview];
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  let query = admin
    .from("media_placements")
    .select("*, asset:media_assets(*)")
    .eq("page_type", pageType)
    .eq("slot", slot)
    .eq("status", "published")
    .eq("enabled", true)
    .or(`start_at.is.null,start_at.lte.${nowIso}`)
    .or(`end_at.is.null,end_at.gt.${nowIso}`)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  const { data, error } = await query;
  if (error || !data) return [];

  // page_identifier matching: null on the placement means "all pages of
  // this type"; otherwise it must match the specific page's identifier.
  const eligible = (data as unknown as MediaPlacementWithAsset[]).filter(
    (p) => p.page_identifier === null || p.page_identifier === pageIdentifier
  );

  if (eligible.length === 0) return [];

  // Respect display_mode from the highest-priority eligible placement:
  // single = only that one; stacked = all eligible ones in order.
  if (eligible[0].display_mode === "single") {
    return [eligible[0]];
  }
  return eligible;
}

export async function getPlacementByPreviewTokenForSlot(
  pageType: PageType,
  slot: SlotId,
  pageIdentifier: string | null | undefined,
  token: string
): Promise<MediaPlacementWithAsset | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("media_placements")
    .select("*, asset:media_assets(*)")
    .eq("preview_token", token)
    .eq("page_type", pageType)
    .eq("slot", slot)
    .maybeSingle();

  if (error || !data) return null;
  const placement = data as unknown as MediaPlacementWithAsset;

  if (!placement.preview_token_expires_at) return null;
  if (new Date(placement.preview_token_expires_at).getTime() < Date.now()) return null;
  if (placement.page_identifier !== null && placement.page_identifier !== pageIdentifier) return null;

  return placement;
}

/** Validates a preview token for a specific placement (used by the admin preview feature). */
export async function getPlacementByPreviewToken(
  placementId: string,
  token: string
): Promise<MediaPlacementWithAsset | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("media_placements")
    .select("*, asset:media_assets(*)")
    .eq("id", placementId)
    .eq("preview_token", token)
    .maybeSingle();

  if (error || !data) return null;

  const placement = data as unknown as MediaPlacementWithAsset;
  if (!placement.preview_token_expires_at) return null;
  if (new Date(placement.preview_token_expires_at).getTime() < Date.now()) return null;

  return placement;
}
