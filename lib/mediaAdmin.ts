import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { MediaAssetRow, MediaPlacementWithAsset } from "./mediaTypes";

export async function getAllMediaAssets(): Promise<MediaAssetRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("media_assets").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as MediaAssetRow[];
}

export async function getAllPlacements(): Promise<MediaPlacementWithAsset[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("media_placements")
    .select("*, asset:media_assets(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as MediaPlacementWithAsset[];
}

export async function getAssetUsageCounts(): Promise<Record<string, number>> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("media_placements").select("media_asset_id").eq("enabled", true);
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data as { media_asset_id: string }[]) {
    counts[row.media_asset_id] = (counts[row.media_asset_id] || 0) + 1;
  }
  return counts;
}
