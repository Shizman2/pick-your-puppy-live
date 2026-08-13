"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { slugify, type PuppyRow } from "../../../lib/puppyTypes";
import { resizeImageForWeb } from "../../../lib/imageProcessing";

export type ActionResult = { success: true } | { success: false; error: string };
export type SavePuppyResult = { success: true; puppyId: string } | { success: false; error: string };

async function requireAdminUser(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  return { ok: true };
}

async function uniqueSlug(admin: ReturnType<typeof createAdminClient>, name: string, breed: string, excludeId?: string) {
  const base = slugify(name, breed);
  let candidate = base;
  let attempt = 1;

  while (true) {
    let query = admin.from("puppies").select("id").eq("slug", candidate).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

export interface PuppyFormFields {
  name: string;
  breed: string;
  priceCents: number;
  gender: PuppyRow["gender"];
  dateOfBirth: string | null;
  size: PuppyRow["size"];
  status: PuppyRow["status"];
  badgeTag: PuppyRow["badge_tag"];
  description: string;
  vetChecked: boolean;
  vaccinated: boolean;
  deliveryAvailable: boolean;
  isFeatured: boolean;
  displayOrder: number;
  breederId: string | null;
  costCents: number;
  bundleCostCents: number;
  salePriceCents: number | null;
  showOnWebsite: boolean;
}

export async function createPuppy(fields: PuppyFormFields): Promise<SavePuppyResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!fields.name.trim() || !fields.breed.trim()) {
    return { success: false, error: "Name and breed are required." };
  }

  const admin = createAdminClient();
  const slug = await uniqueSlug(admin, fields.name, fields.breed);

  const { data, error } = await admin
    .from("puppies")
    .insert({
      name: fields.name.trim(),
      slug,
      breed: fields.breed.trim(),
      price_cents: fields.priceCents,
      gender: fields.gender,
      date_of_birth: fields.dateOfBirth || null,
      size: fields.size,
      status: fields.status,
      badge_tag: fields.badgeTag,
      description: fields.description.trim() || null,
      vet_checked: fields.vetChecked,
      vaccinated: fields.vaccinated,
      delivery_available: fields.deliveryAvailable,
      is_featured: fields.isFeatured,
      display_order: fields.displayOrder,
      breeder_id: fields.breederId,
      cost_cents: fields.costCents,
      bundle_cost_cents: fields.bundleCostCents,
      sale_price_cents: fields.salePriceCents,
      show_on_website: fields.showOnWebsite,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/puppies");
  return { success: true, puppyId: data.id };
}

export async function updatePuppy(puppyId: string, fields: PuppyFormFields): Promise<SavePuppyResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!fields.name.trim() || !fields.breed.trim()) {
    return { success: false, error: "Name and breed are required." };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin.from("puppies").select("name, breed, slug").eq("id", puppyId).maybeSingle();
  let slug = existing?.slug;
  if (existing && (existing.name !== fields.name.trim() || existing.breed !== fields.breed.trim())) {
    slug = await uniqueSlug(admin, fields.name, fields.breed, puppyId);
  }

  const { error } = await admin
    .from("puppies")
    .update({
      name: fields.name.trim(),
      slug,
      breed: fields.breed.trim(),
      price_cents: fields.priceCents,
      gender: fields.gender,
      date_of_birth: fields.dateOfBirth || null,
      size: fields.size,
      status: fields.status,
      badge_tag: fields.badgeTag,
      description: fields.description.trim() || null,
      vet_checked: fields.vetChecked,
      vaccinated: fields.vaccinated,
      delivery_available: fields.deliveryAvailable,
      is_featured: fields.isFeatured,
      display_order: fields.displayOrder,
      breeder_id: fields.breederId,
      cost_cents: fields.costCents,
      bundle_cost_cents: fields.bundleCostCents,
      sale_price_cents: fields.salePriceCents,
      show_on_website: fields.showOnWebsite,
    })
    .eq("id", puppyId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/puppies");
  revalidatePath(`/admin/puppies/${puppyId}`);
  return { success: true, puppyId };
}

export async function deletePuppy(puppyId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("puppies").delete().eq("id", puppyId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/puppies");
  return { success: true };
}

export type UploadPhotoResult = { success: true; url: string } | { success: false; error: string };

export async function uploadPuppyPhoto(puppyId: string, formData: FormData): Promise<UploadPhotoResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided." };

  const admin = createAdminClient();

  let processedBuffer: Buffer;
  let contentType: string;
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const result = await resizeImageForWeb(inputBuffer);
    processedBuffer = result.buffer;
    contentType = result.contentType;
  } catch (err) {
    return { success: false, error: err instanceof Error ? `Image processing failed: ${err.message}` : "Image processing failed." };
  }

  const filePath = `puppies/${puppyId}/${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await admin.storage.from("puppy-photos").upload(filePath, processedBuffer, {
    upsert: true,
    contentType,
  });
  if (uploadError) return { success: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from("puppy-photos").getPublicUrl(filePath);

  const { data: puppy, error: fetchError } = await admin
    .from("puppies")
    .select("photo_urls")
    .eq("id", puppyId)
    .maybeSingle();
  if (fetchError) return { success: false, error: fetchError.message };

  const updatedUrls = [...((puppy?.photo_urls as string[]) || []), publicUrl];

  const { error: updateError } = await admin
    .from("puppies")
    .update({ photo_urls: updatedUrls })
    .eq("id", puppyId);
  if (updateError) return { success: false, error: updateError.message };

  revalidatePath(`/admin/puppies/${puppyId}`);
  revalidatePath("/admin/puppies");
  return { success: true, url: publicUrl };
}

export type OptimizeAllPhotosResult =
  | { success: true; processed: number; skipped: number; errors: string[] }
  | { success: false; error: string };

/**
 * One-time cleanup for photos uploaded before resizing was added to the
 * upload flow. Re-downloads each existing photo, resizes/recompresses it,
 * and overwrites it at its EXISTING storage path - so puppies.photo_urls
 * never needs to change, nothing can end up broken or orphaned.
 *
 * Safe to run more than once: re-processing an already-optimized photo
 * just re-saves it at roughly the same size, so if this times out partway
 * through on a large photo library, simply running it again picks up
 * where a fresh pass would naturally leave off (no per-photo tracking
 * needed since the operation is idempotent).
 */
export async function optimizeAllExistingPuppyPhotos(): Promise<OptimizeAllPhotosResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { data: puppies, error } = await admin.from("puppies").select("id, photo_urls");
  if (error) return { success: false, error: error.message };

  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const puppy of puppies || []) {
    const urls = (puppy.photo_urls as string[]) || [];
    for (const url of urls) {
      const marker = "/puppy-photos/";
      const idx = url.indexOf(marker);
      if (idx === -1) {
        skipped++;
        continue;
      }
      const storagePath = url.slice(idx + marker.length);

      try {
        const res = await fetch(url);
        if (!res.ok) {
          errors.push(`${storagePath}: fetch failed (${res.status})`);
          continue;
        }
        const inputBuffer = Buffer.from(await res.arrayBuffer());
        const { buffer, contentType } = await resizeImageForWeb(inputBuffer);

        const { error: uploadError } = await admin.storage
          .from("puppy-photos")
          .upload(storagePath, buffer, { upsert: true, contentType });

        if (uploadError) {
          errors.push(`${storagePath}: ${uploadError.message}`);
          continue;
        }
        processed++;
      } catch (err) {
        errors.push(`${storagePath}: ${err instanceof Error ? err.message : "unknown error"}`);
      }
    }
  }

  revalidatePath("/", "layout");
  return { success: true, processed, skipped, errors };
}
  const auth = await requireAdminUser();
export async function removePuppyPhoto(puppyId: string, url: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();

  const { data: puppy, error: fetchError } = await admin
    .from("puppies")
    .select("photo_urls")
    .eq("id", puppyId)
    .maybeSingle();
  if (fetchError) return { success: false, error: fetchError.message };

  const updatedUrls = ((puppy?.photo_urls as string[]) || []).filter((u) => u !== url);

  const { error: updateError } = await admin
    .from("puppies")
    .update({ photo_urls: updatedUrls })
    .eq("id", puppyId);
  if (updateError) return { success: false, error: updateError.message };

  revalidatePath(`/admin/puppies/${puppyId}`);
  revalidatePath("/admin/puppies");
  return { success: true };
}
