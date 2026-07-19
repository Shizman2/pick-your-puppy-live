"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

export type ActionResult = { success: true } | { success: false; error: string };
export type SaveBreederResult = { success: true; breederId: string } | { success: false; error: string };

async function requireAdminUser(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  return { ok: true };
}

export interface BreederFormFields {
  name: string;
  phone: string;
  email: string;
  location: string;
  breeds: string[];
  notes: string;
}

export async function createBreeder(fields: BreederFormFields): Promise<SaveBreederResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!fields.name.trim()) {
    return { success: false, error: "Name is required." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("breeders")
    .insert({
      name: fields.name.trim(),
      phone: fields.phone.trim() || null,
      email: fields.email.trim() || null,
      location: fields.location.trim() || null,
      breeds: fields.breeds.filter(Boolean),
      notes: fields.notes.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/breeders");
  return { success: true, breederId: data.id };
}

export async function updateBreeder(breederId: string, fields: BreederFormFields): Promise<SaveBreederResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!fields.name.trim()) {
    return { success: false, error: "Name is required." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("breeders")
    .update({
      name: fields.name.trim(),
      phone: fields.phone.trim() || null,
      email: fields.email.trim() || null,
      location: fields.location.trim() || null,
      breeds: fields.breeds.filter(Boolean),
      notes: fields.notes.trim() || null,
    })
    .eq("id", breederId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/breeders");
  revalidatePath(`/admin/breeders/${breederId}`);
  return { success: true, breederId };
}

export async function deleteBreeder(breederId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("breeders").delete().eq("id", breederId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/breeders");
  return { success: true };
}
