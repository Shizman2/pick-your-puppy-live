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
 * Deletes only `messages` and `conversations` rows for the given
 * contact ids - shared by deleteConversation/deleteConversations/
 * deleteAllConversations so all three have exactly the same scope.
 *
 * Deliberately does NOT touch `inquiries` or `interests`: those hold
 * the actual submitted business data (inquiries' own columns are the
 * submitted Puppy Finder criteria - breed/budget_min/budget_max/
 * timeframe - plus reservation fields like pickup_or_delivery, and
 * puppy_interest/general fields), not message-log data. The public
 * Puppy Finder results page (app/(public)/puppy-finder/results/
 * [token]/page.tsx) reads inquiries.breed via
 * puppy_finder_proposals.inquiry_id, so deleting inquiries here would
 * silently degrade a live customer-facing page. Never touches `sales`,
 * `contacts`, or anything affiliate/analytics-related either.
 */
async function deleteMessageThreadsFor(contactIds: string[]): Promise<ActionResult> {
  const admin = createAdminClient();

  const { error: messagesError } = await admin.from("messages").delete().in("contact_id", contactIds);
  if (messagesError) return { success: false, error: messagesError.message };

  const { error: conversationsError } = await admin.from("conversations").delete().in("contact_id", contactIds);
  if (conversationsError) return { success: false, error: conversationsError.message };

  return { success: true };
}

/**
 * "Delete Conversation" - clears this one contact's messages/
 * conversation thread, not the contact itself. The contact keeps
 * existing (so it still shows up fine in the Contacts list) - deleting
 * the contact entirely is a separate, explicit action (see
 * archiveContact/deleteContactCompletely in app/admin/contacts/actions.ts).
 */
export async function deleteConversation(contactId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const result = await deleteMessageThreadsFor([contactId]);
  if (!result.success) return result;

  revalidatePath("/admin/messages");
  revalidatePath("/admin/contacts");
  revalidatePath(`/admin/contacts/${contactId}`);
  revalidatePath("/admin/dashboard");
  return { success: true };
}

/**
 * "Delete (N)" - the multi-select bulk-delete action from the Message
 * Center's selection mode. Same scope/safety as deleteConversation,
 * just across every selected contact id in one call.
 */
export async function deleteConversations(contactIds: string[]): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };
  if (contactIds.length === 0) return { success: true };

  const result = await deleteMessageThreadsFor(contactIds);
  if (!result.success) return result;

  revalidatePath("/admin/messages");
  revalidatePath("/admin/contacts");
  for (const contactId of contactIds) revalidatePath(`/admin/contacts/${contactId}`);
  revalidatePath("/admin/dashboard");
  return { success: true };
}

/**
 * "Delete All Messages" - every conversation/message in the Message
 * Center, system-wide. There is no filter/search/pagination in this
 * view to scope against (getMessageCenterData loads every contact
 * unconditionally in one query - see lib/messageCenter.ts), so "all"
 * unambiguously means every messages/conversations row that exists.
 * Same messages+conversations-only scope as the other two - inquiries,
 * interests, contacts, and sales are never touched.
 */
export async function deleteAllConversations(): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();

  // `.not("id", "is", null)` matches every row - id is never null - so
  // this is an explicit, deliberate "delete all", not an accidental
  // unfiltered delete.
  const { error: messagesError } = await admin.from("messages").delete().not("id", "is", null);
  if (messagesError) return { success: false, error: messagesError.message };

  const { error: conversationsError } = await admin.from("conversations").delete().not("id", "is", null);
  if (conversationsError) return { success: false, error: conversationsError.message };

  revalidatePath("/admin/messages");
  revalidatePath("/admin/contacts");
  revalidatePath("/admin/dashboard");
  return { success: true };
}
