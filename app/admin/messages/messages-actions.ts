"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

async function requireAdminUser(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authenticated" };
  return { ok: true };
}

export type ActionResult = { success: true } | { success: false; error: string };

/**
 * Marks every unread inbound message for this contact as read. Fired
 * when a staff member opens the conversation in the Message Center -
 * this is a read-only checkpoint otherwise, this is the one write it
 * performs, and it's purely a "has this been seen" flag, not a reply.
 */
export async function markConversationRead(contactId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("messages")
    .update({ is_read: true })
    .eq("contact_id", contactId)
    .eq("direction", "inbound")
    .eq("is_read", false);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/messages");
  revalidatePath("/admin/contacts");
  revalidatePath(`/admin/contacts/${contactId}`);
  return { success: true };
}
