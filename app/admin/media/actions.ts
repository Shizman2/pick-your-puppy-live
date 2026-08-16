"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import type { PageType, MediaType, SlotId, FitMode, Alignment, LinkTarget, DisplayMode } from "../../../lib/mediaTypes";
import { resizeImageForWeb } from "../../../lib/imageProcessing";

export type ActionResult<T = undefined> = { success: true; data?: T } | { success: false; error: string };

async function requireAdminUser(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  return { ok: true };
}

/** Revalidates only the route(s) actually affected by a placement, per the spec. */
async function revalidateForPlacement(pageType: PageType, pageIdentifier: string | null) {
  if (pageType === "homepage") {
    revalidatePath("/");
    return;
  }
  if (pageType === "puppy_finder") {
    revalidatePath("/puppy-finder");
    return;
  }
  if (pageType === "puppies") {
    revalidatePath("/puppies");
    return;
  }
  if (pageType === "puppy_detail") {
    if (!pageIdentifier) {
      // Applies to all puppy detail pages - revalidate the dynamic route pattern.
      revalidatePath("/puppies/[slug]", "page");
      return;
    }
    // Specific puppy - look up its current slug so we revalidate the exact URL.
    const admin = createAdminClient();
    const { data } = await admin.from("puppies").select("slug").eq("id", pageIdentifier).maybeSingle();
    if (data?.slug) revalidatePath(`/puppies/${data.slug}`);
    return;
  }
}

// ── Asset Library ──────────────────────────────────────────────

export async function uploadMediaAsset(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const file = formData.get("file") as File | null;
  const mobileFile = formData.get("mobileFile") as File | null;
  const desktopFile = formData.get("desktopFile") as File | null;
  const internalName = (formData.get("internalName") as string)?.trim();
  const mediaType = formData.get("mediaType") as MediaType;
  const altText = (formData.get("altText") as string)?.trim() || null;
  const isDecorative = formData.get("isDecorative") === "true";

  if (!file) return { success: false, error: "An image file is required." };
  if (!internalName) return { success: false, error: "Internal name is required." };
  if (!isDecorative && !altText) return { success: false, error: "Alt text is required unless the image is marked decorative." };

  const admin = createAdminClient();

  async function uploadOne(f: File): Promise<string> {
    const inputBuffer = Buffer.from(await f.arrayBuffer());
    const { buffer, contentType } = await resizeImageForWeb(inputBuffer, 2000);
    const path = `assets/${randomUUID()}.jpg`;
    const { error } = await admin.storage.from("media-assets").upload(path, buffer, { upsert: true, contentType });
    if (error) throw new Error(error.message);
    const {
      data: { publicUrl },
    } = admin.storage.from("media-assets").getPublicUrl(path);
    return publicUrl;
  }

  try {
    const fileUrl = await uploadOne(file);
    const mobileUrl = mobileFile && mobileFile.size > 0 ? await uploadOne(mobileFile) : null;
    const desktopUrl = desktopFile && desktopFile.size > 0 ? await uploadOne(desktopFile) : null;

    const { data, error } = await admin
      .from("media_assets")
      .insert({
        internal_name: internalName,
        file_url: fileUrl,
        mobile_file_url: mobileUrl,
        desktop_file_url: desktopUrl,
        media_type: mediaType,
        alt_text: altText,
        is_decorative: isDecorative,
        file_size: file.size,
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/media");
    return { success: true, data: { id: data.id } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Upload failed." };
  }
}

export async function getAssetUsageCount(assetId: string): Promise<number> {
  const auth = await requireAdminUser();
  if (!auth.ok) return 0;

  const admin = createAdminClient();
  const { count } = await admin
    .from("media_placements")
    .select("id", { count: "exact", head: true })
    .eq("media_asset_id", assetId)
    .eq("enabled", true);
  return count || 0;
}

export async function replaceMediaAsset(assetId: string, formData: FormData): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "An image file is required." };

  const admin = createAdminClient();

  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const { buffer, contentType } = await resizeImageForWeb(inputBuffer, 2000);
    const path = `assets/${randomUUID()}.jpg`;
    const { error: uploadError } = await admin.storage.from("media-assets").upload(path, buffer, { upsert: true, contentType });
    if (uploadError) throw new Error(uploadError.message);

    const {
      data: { publicUrl },
    } = admin.storage.from("media-assets").getPublicUrl(path);

    // Only update the row after the new file uploaded successfully - the
    // old file/URL is never touched until this point, so a failed upload
    // never breaks the existing asset.
    const { error } = await admin
      .from("media_assets")
      .update({ file_url: publicUrl, file_size: file.size })
      .eq("id", assetId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/media");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Replace failed." };
  }
}

export async function archiveMediaAsset(assetId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("media_assets").update({ archived: true }).eq("id", assetId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/media");
  return { success: true };
}

// ── Placements ──────────────────────────────────────────────

export interface PlacementFields {
  internalName: string;
  mediaAssetId: string;
  pageType: PageType;
  pageIdentifier: string | null;
  slot: SlotId;
  displayMode: DisplayMode;
  priority: number;
  enabled: boolean;
  startAt: string | null;
  endAt: string | null;
  mobileVisible: boolean;
  desktopVisible: boolean;
  linkUrl: string | null;
  linkTarget: LinkTarget;
  fitMode: FitMode;
  alignment: Alignment;
  maxWidthPx: number | null;
  heightPx: number | null;
  borderRadiusPx: number;
  backgroundColor: string | null;
  imageScalePercent: number;
  imageOffsetX: number;
  imageOffsetY: number;
  paddingTopPx: number;
  paddingBottomPx: number;
}

function toRow(fields: PlacementFields) {
  return {
    internal_name: fields.internalName,
    media_asset_id: fields.mediaAssetId,
    page_type: fields.pageType,
    page_identifier: fields.pageIdentifier,
    slot: fields.slot,
    display_mode: fields.displayMode,
    priority: fields.priority,
    enabled: fields.enabled,
    start_at: fields.startAt,
    end_at: fields.endAt,
    mobile_visible: fields.mobileVisible,
    desktop_visible: fields.desktopVisible,
    link_url: fields.linkUrl,
    link_target: fields.linkTarget,
    fit_mode: fields.fitMode,
    alignment: fields.alignment,
    max_width_px: fields.maxWidthPx,
    height_px: fields.heightPx,
    border_radius_px: fields.borderRadiusPx,
    background_color: fields.backgroundColor,
    image_scale_percent: fields.imageScalePercent,
    image_offset_x: fields.imageOffsetX,
    image_offset_y: fields.imageOffsetY,
    padding_top_px: fields.paddingTopPx,
    padding_bottom_px: fields.paddingBottomPx,
  };
}

export async function createPlacement(fields: PlacementFields): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!fields.internalName.trim() || !fields.mediaAssetId) {
    return { success: false, error: "Name and media asset are required." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("media_placements").insert(toRow(fields)).select("id").single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/media");
  return { success: true, data: { id: data.id } };
}

export async function updatePlacement(id: string, fields: PlacementFields): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("media_placements").update(toRow(fields)).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/media");
  await revalidateForPlacement(fields.pageType, fields.pageIdentifier);
  return { success: true };
}

export async function deletePlacement(id: string, pageType: PageType, pageIdentifier: string | null): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("media_placements").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/media");
  await revalidateForPlacement(pageType, pageIdentifier);
  return { success: true };
}

export async function setPlacementStatus(
  id: string,
  status: "draft" | "published" | "paused",
  pageType: PageType,
  pageIdentifier: string | null
): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("media_placements").update({ status }).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/media");
  await revalidateForPlacement(pageType, pageIdentifier);
  return { success: true };
}

/** Generates a short-lived preview token for a draft placement - never exposes admin access, just lets that one placement render for ~30 minutes. */
export async function generatePreviewToken(id: string): Promise<ActionResult<{ token: string; expiresAt: string }>> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const admin = createAdminClient();
  const { error } = await admin
    .from("media_placements")
    .update({ preview_token: token, preview_token_expires_at: expiresAt })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: { token, expiresAt } };
}
