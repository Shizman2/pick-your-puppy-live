import "server-only";
import { createAdminClient } from "./supabase/admin";

export async function getUnreadMessageCount(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("direction", "inbound")
    .eq("is_read", false);
  return count || 0;
}
