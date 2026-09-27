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

/**
 * Resolves a puppy's free-text `breed` string to its centralized Breed
 * Profile row, for the public puppy detail page. There's no foreign key
 * (puppies.breed is plain text - see PuppyForm.tsx) - matching happens
 * here, case-insensitively, against EITHER breeds.name (the full breed
 * name, e.g. "Yorkshire Terrier") OR breeds.short_name (e.g. "Yorkie"),
 * so a puppy typed either way resolves to the same profile. Returns
 * null (no throw) on no match - the public page treats that exactly
 * like "no Breed Profile" and hides the section, since an unmatched
 * breed string is an expected, non-error case (e.g. "teddybear" has no
 * breed row yet).
 */
export async function getBreedForPuppyBreedString(breedString: string): Promise<BreedRow | null> {
  const target = breedString.trim().toLowerCase();
  if (!target) return null;

  // The breeds table only ever holds a handful of rows (one per dog
  // breed this business carries), so fetching all of them and matching
  // in JS is simpler and safer than building a filter string for
  // PostgREST's .or() - breed names/short names are free text and could
  // in principle contain characters (commas, parens) that would corrupt
  // a hand-built .or() filter expression.
  const breeds = await getBreedsListData();
  return (
    breeds.find(
      (b) => b.name.trim().toLowerCase() === target || (b.short_name || "").trim().toLowerCase() === target
    ) || null
  );
}
