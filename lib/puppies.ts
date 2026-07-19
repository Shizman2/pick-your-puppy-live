import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { PuppyRow } from "./puppyTypes";

export async function getPuppiesListData(): Promise<PuppyRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("puppies")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as PuppyRow[];
}

export async function getPuppyById(id: string): Promise<PuppyRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("puppies").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  return (data as PuppyRow) || null;
}
