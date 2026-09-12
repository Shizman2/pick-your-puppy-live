import "server-only";
import { createServerSupabaseClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";

export type AdminAuthResult = { ok: true; userId: string; email: string | null } | { ok: false; error: string };
export type AffiliateAuthResult =
  | { ok: true; userId: string; affiliateId: string }
  | { ok: false; error: string };

/**
 * Role-checked admin guard - not just "is there a session" (that was the
 * entire security model before the affiliate program existed, and is no
 * longer safe now that affiliate accounts share the same auth.users
 * pool). Checks user_roles for an explicit 'admin' row.
 */
export async function requireAdminUser(): Promise<AdminAuthResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: role } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!role) return { ok: false, error: "Not authorized as admin" };

  return { ok: true, userId: user.id, email: user.email ?? null };
}

/**
 * Affiliate guard - requires the 'affiliate' role AND an approved
 * affiliates row (a suspended/rejected/pending affiliate never reaches
 * the portal, even if their auth session is still technically valid).
 */
export async function requireAffiliateUser(): Promise<AffiliateAuthResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: role } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "affiliate")
    .maybeSingle();

  if (!role) return { ok: false, error: "Not authorized as affiliate" };

  const { data: affiliate } = await admin
    .from("affiliates")
    .select("id, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!affiliate || affiliate.status !== "approved") {
    return { ok: false, error: "Affiliate account is not currently approved" };
  }

  return { ok: true, userId: user.id, affiliateId: affiliate.id };
}
