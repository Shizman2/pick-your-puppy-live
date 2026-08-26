import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { BreedRow } from "./breedTypes";

export async function getBreedsListData(): Promise<BreedRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("breeds").select("*").order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as BreedRow[];
}

export async function getBreedById(id: string): Promise<BreedRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("breeds").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  return (data as BreedRow) || null;
}
