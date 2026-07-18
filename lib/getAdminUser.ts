import "server-only";
import { createServerSupabaseClient } from "./supabase/server";

export async function getAdminUserEmail(): Promise<string | null> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}
