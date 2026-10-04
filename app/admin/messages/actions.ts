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
 * Deletes `messages` and `conversations` rows for the given contact ids,
 * and tombstones each contact's clear time - shared by
 * deleteConversation/deleteConversations/deleteAllConversations so all
 * three have exactly the same scope and the same fix.
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
 * `contacts` themselves, or anything affiliate/analytics-related either.
 *
 * contacts.messages_cleared_at (supabase/033_message_center_clear_tombstone.sql)
 * is the actual bug fix: without it, getMessageCenterData
 * (lib/messageCenter.ts) has no way to tell "this contact's thread was
 * intentionally cleared" apart from "this contact just has old inquiries
 * and was never touched" - since inquiries are never deleted, the old
 * behavior resurrected every deleted conversation the moment the page
 * next fully reloaded. A genuinely NEW inquiry submitted after this
 * timestamp still correctly reopens the conversation (see that file).
 */
async function deleteMessageThreadsFor(contactIds: string[]): Promise<ActionResult> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { error: messagesError } = await admin.from("messages").delete().in("contact_id", contactIds);
  if (messagesError) return { success: false, error: messagesError.message };

  const { error: conversationsError } = await admin.from("conversations").delete().in("contact_id", contactIds);
  if (conversationsError) return { success: false, error: conversationsError.message };

  // Defensive compatibility: messages_cleared_at only exists once
  // supabase/033_message_center_clear_tombstone.sql has actually been
  // run (deliberately not run automatically). Until then, PostgREST
  // rejects the update (PGRST204 for the payload key, or 42703 if it
  // reaches Postgres directly - both confirmed as real PostgREST
  // behaviors earlier in this project, see lib/businessScorecard.ts).
  // Messages/conversations are already deleted by this point regardless
  // - swallowing this specific error here keeps delete from regressing
  // to a hard failure pre-migration; the resurrection bug just isn't
  // fixed yet until the migration runs, same as before this change.
  const { error: tombstoneError } = await admin
    .from("contacts")
    .update({ messages_cleared_at: nowIso })
    .in("id", contactIds);
  if (tombstoneError && tombstoneError.code !== "PGRST204" && tombstoneError.code !== "42703") {
    return { success: false, error: tombstoneError.message };
  }

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
 * interests, contacts, and sales are never touched. Also tombstones
 * every contact's messages_cleared_at (see deleteMessageThreadsFor's own
 * comment for why that's required) so this doesn't fall into the same
 * resurrection bug the single/bulk delete actions had.
 */
export async function deleteAllConversations(): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  // `.not("id", "is", null)` matches every row - id is never null - so
  // this is an explicit, deliberate "delete all", not an accidental
  // unfiltered delete.
  const { error: messagesError } = await admin.from("messages").delete().not("id", "is", null);
  if (messagesError) return { success: false, error: messagesError.message };

  const { error: conversationsError } = await admin.from("conversations").delete().not("id", "is", null);
  if (conversationsError) return { success: false, error: conversationsError.message };

  // Same defensive pre-migration compatibility as deleteMessageThreadsFor above.
  const { error: tombstoneError } = await admin.from("contacts").update({ messages_cleared_at: nowIso }).not("id", "is", null);
  if (tombstoneError && tombstoneError.code !== "PGRST204" && tombstoneError.code !== "42703") {
    return { success: false, error: tombstoneError.message };
  }

  revalidatePath("/admin/messages");
  revalidatePath("/admin/contacts");
  revalidatePath("/admin/dashboard");
  return { success: true };
}
