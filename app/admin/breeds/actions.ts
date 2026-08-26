"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

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
}

export async function createBreed(fields: BreedFormFields): Promise<SaveBreedResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!fields.name.trim()) {
    return { success: false, error: "Breed name is required." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("breeds")
    .insert({
      name: fields.name.trim(),
      expected_adult_size: fields.expectedAdultSize.trim() || null,
      description: fields.description.trim() || null,
    })
    .select("id")
    .single();

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
    .update({
      name: fields.name.trim(),
      expected_adult_size: fields.expectedAdultSize.trim() || null,
      description: fields.description.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", breedId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/breeds");
  revalidatePath(`/admin/breeds/${breedId}`);
  return { success: true, breedId };
}

export async function deleteBreed(breedId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("breeds").delete().eq("id", breedId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/breeds");
  return { success: true };
}
