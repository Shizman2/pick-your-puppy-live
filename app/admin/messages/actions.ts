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

/**
 * "Delete Conversation" - clears this contact's messages/inquiries, not
 * the contact itself. The contact keeps existing (so it still shows up
 * fine in the Message Center and Contacts list, just with an empty
 * thread) - deleting the contact entirely is a separate, explicit action
 * (see archiveContact/deleteContactCompletely in
 * app/admin/contacts/actions.ts). Deliberately never touches `sales`.
 */
export async function deleteConversation(contactId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();

  const { error: messagesError } = await admin.from("messages").delete().eq("contact_id", contactId);
  if (messagesError) return { success: false, error: messagesError.message };

  const { error: conversationsError } = await admin.from("conversations").delete().eq("contact_id", contactId);
  if (conversationsError) return { success: false, error: conversationsError.message };

  const { error: interestsError } = await admin.from("interests").delete().eq("contact_id", contactId);
  if (interestsError) return { success: false, error: interestsError.message };

  const { error: inquiriesError } = await admin.from("inquiries").delete().eq("contact_id", contactId);
  if (inquiriesError) return { success: false, error: inquiriesError.message };

  // Only the timeline entries that are themselves a record of this
  // conversation - status changes, notes, and sale/puppy-finder events
  // aren't part of "the conversation" and stay untouched.
  const { error: timelineError } = await admin
    .from("timeline_events")
    .delete()
    .eq("contact_id", contactId)
    .eq("event_type", "form_submitted");
  if (timelineError) return { success: false, error: timelineError.message };

  revalidatePath("/admin/messages");
  revalidatePath("/admin/contacts");
  revalidatePath(`/admin/contacts/${contactId}`);
  revalidatePath("/admin/dashboard");
  return { success: true };
}
