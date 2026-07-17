"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../lib/supabase/server";
import type { EventRow } from "../../lib/eventTypes";

/**
 * V1 is single-event only, so admin reads/writes target "the one event
 * row" directly rather than a hardcoded slug - the slug itself is the
 * private, regenerable attendee-facing URL and shouldn't be relied on
 * as a stable lookup key here. Writes use the row's own id instead.
 * Multi-event support (flagged as future work in the original spec)
 * would replace getEvent() with a real event picker, but nothing else
 * here would need to change.
 */
async function requireAdminSession() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }
}

export async function getEvent(): Promise<EventRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("events")
    .select("*")
    .limit(1)
    .single();

  if (error) return null;
  return data as EventRow;
}

export async function saveEventDraft(id: string, fields: Partial<EventRow>) {
  await requireAdminSession();

  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/show", "layout");
}

export async function setEventStatus(id: string, status: "draft" | "published" | "unpublished") {
  await requireAdminSession();

  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/show", "layout");
}

export async function uploadImage(
  id: string,
  formData: FormData,
  targetColumn: "featured_image_url" | "banner_image_url"
) {
  await requireAdminSession();

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file provided");

  const admin = createAdminClient();
  const fileExt = file.name.split(".").pop();
  const filePath = `${id}-${targetColumn}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await admin.storage
    .from("event-images")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = admin.storage.from("event-images").getPublicUrl(filePath);

  const { error: updateError } = await admin
    .from("events")
    .update({ [targetColumn]: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/admin");
  revalidatePath("/show", "layout");

  return publicUrl;
}

export async function removeImage(
  id: string,
  targetColumn: "featured_image_url" | "banner_image_url"
) {
  await requireAdminSession();

  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({ [targetColumn]: null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/show", "layout");
}

