"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { slugify, type PuppyRow } from "../../../lib/puppyTypes";

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
  const fileExt = file.name.split(".").pop() || "jpg";
  const filePath = `puppies/${puppyId}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await admin.storage.from("puppy-photos").upload(filePath, file, {
    upsert: true,
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
