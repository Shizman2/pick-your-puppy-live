import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { BreederRow } from "./breederTypes";
import type { PuppyRow } from "./puppyTypes";

export async function getBreedersListData(): Promise<BreederRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("breeders").select("*").order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as BreederRow[];
}

export async function getBreederById(id: string): Promise<BreederRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("breeders").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  return (data as BreederRow) || null;
}

export async function getPuppiesForBreeder(breederId: string): Promise<PuppyRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("puppies")
    .select("*")
    .eq("breeder_id", breederId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as PuppyRow[];
}

export async function getAllBreedersForSelect(): Promise<Pick<BreederRow, "id" | "name">[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("breeders").select("id, name").order("name", { ascending: true });

  if (error) return [];
  return data || [];
}
