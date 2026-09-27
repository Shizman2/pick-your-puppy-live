"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { resizeImagePreservingTransparency } from "../../../lib/imageProcessing";

export type ActionResult = { success: true } | { success: false; error: string };
export type SaveBreedResult = { success: true; breedId: string } | { success: false; error: string };

async function requireAdminUser(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  return { ok: true };
}

export interface BreedFormFields {
  name: string;
  expectedAdultSize: string;
  description: string;
  // Breed Profile fields (supabase/025_breed_profiles.sql)
  shortName: string;
  personality: string;
  energyLevel: string;
  groomingLevel: string;
  livingSpaceFit: string;
  companionStyle: string;
  goodToKnow: string;
  showProfile: boolean;
}

function breedFieldsToRow(fields: BreedFormFields) {
  return {
    name: fields.name.trim(),
    expected_adult_size: fields.expectedAdultSize.trim() || null,
    description: fields.description.trim() || null,
    short_name: fields.shortName.trim() || null,
    personality: fields.personality.trim() || null,
    energy_level: fields.energyLevel.trim() || null,
    grooming_level: fields.groomingLevel.trim() || null,
    living_space_fit: fields.livingSpaceFit.trim() || null,
    companion_style: fields.companionStyle.trim() || null,
    good_to_know: fields.goodToKnow.trim() || null,
    show_profile: fields.showProfile,
  };
}

export async function createBreed(fields: BreedFormFields): Promise<SaveBreedResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!fields.name.trim()) {
    return { success: false, error: "Breed name is required." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("breeds").insert(breedFieldsToRow(fields)).select("id").single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/breeds");
  return { success: true, breedId: data.id };
}

export async function updateBreed(breedId: string, fields: BreedFormFields): Promise<SaveBreedResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!fields.name.trim()) {
    return { success: false, error: "Breed name is required." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("breeds")
    .update({ ...breedFieldsToRow(fields), updated_at: new Date().toISOString() })
    .eq("id", breedId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/breeds");
  revalidatePath(`/admin/breeds/${breedId}`);
  // A change here can affect every puppy detail page whose breed
  // resolves to this row - those are cached (revalidate = 60, see
  // app/(public)/puppies/[slug]/page.tsx), so nudge the whole /puppies
  // subtree instead of trying to know which slugs are affected.
  revalidatePath("/puppies", "layout");
  return { success: true, breedId };
}

export async function deleteBreed(breedId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("breeds").delete().eq("id", breedId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/breeds");
  revalidatePath("/puppies", "layout");
  return { success: true };
}

export type UploadBreedImageResult = { success: true; url: string } | { success: false; error: string };

/**
 * Breed Profile image upload. Reuses the existing "puppy-photos" Storage
 * bucket (see uploadPuppyPhoto in app/admin/puppies/actions.ts) under
 * its own "breed-profiles/" prefix rather than creating a new bucket -
 * this project's storage buckets are provisioned outside of the tracked
 * SQL migrations (no migration creates "puppy-photos" either), so
 * reusing the one already known to exist and be correctly configured is
 * safer than having this migration/deploy depend on a new bucket +
 * policies being set up somewhere I can't verify.
 *
 * Deliberately does NOT use resizeImageForWeb (puppy photos' resize
 * helper) - that re-encodes everything as opaque JPEG, which would
 * flatten a transparent breed cutout image onto a black background
 * (sharp's default when an image with alpha is encoded to a format with
 * none). Breed Profile images are meant to sit on the section's own
 * colored background, so uses resizeImagePreservingTransparency instead
 * (lib/imageProcessing.ts), which outputs PNG and keeps the alpha
 * channel intact. Puppy photo uploads are untouched by this.
 */
export async function uploadBreedProfileImage(breedId: string, formData: FormData): Promise<UploadBreedImageResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided." };

  const admin = createAdminClient();

  let processedBuffer: Buffer;
  let contentType: string;
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const result = await resizeImagePreservingTransparency(inputBuffer);
    processedBuffer = result.buffer;
    contentType = result.contentType;
  } catch (err) {
    return { success: false, error: err instanceof Error ? `Image processing failed: ${err.message}` : "Image processing failed." };
  }

  const filePath = `breed-profiles/${breedId}/${crypto.randomUUID()}.png`;

  const { error: uploadError } = await admin.storage.from("puppy-photos").upload(filePath, processedBuffer, {
    upsert: true,
    contentType,
  });
  if (uploadError) return { success: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from("puppy-photos").getPublicUrl(filePath);

  const { error: updateError } = await admin
    .from("breeds")
    .update({ profile_image_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", breedId);
  if (updateError) return { success: false, error: updateError.message };

  revalidatePath("/admin/breeds");
  revalidatePath(`/admin/breeds/${breedId}`);
  revalidatePath("/puppies", "layout");
  return { success: true, url: publicUrl };
}

export async function removeBreedProfileImage(breedId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("breeds")
    .update({ profile_image_url: null, updated_at: new Date().toISOString() })
    .eq("id", breedId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/breeds");
  revalidatePath(`/admin/breeds/${breedId}`);
  revalidatePath("/puppies", "layout");
  return { success: true };
}
