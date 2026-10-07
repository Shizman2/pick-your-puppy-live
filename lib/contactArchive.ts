import "server-only";
import { createAdminClient } from "./supabase/admin";

// Keeps each `id=in.(...)` request URL comfortably short.
const CHUNK_SIZE = 100;

/**
 * Archives or restores contacts - the Contacts list's bulk "Archive" /
 * "Restore" actions. Only ever flips contacts.is_archived: inquiries,
 * messages, conversations, sales, payments, Puppy Finder proposals,
 * affiliate attribution, generated documents and timeline history are
 * never touched, so archiving is fully reversible and nothing about a
 * contact's business history is lost.
 *
 * An archived contact drops out of the active Contacts list, the
 * Message Center and every unread count (lib/unread.ts). A new website
 * inquiry from them restores them automatically (app/api/inquire/route.ts).
 */
export async function setContactsArchived(contactIds: string[], archived: boolean): Promise<number> {
  const ids = Array.from(new Set(contactIds.filter(Boolean)));
  if (ids.length === 0) return 0;

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  let updated = 0;

  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const { data, error } = await admin
      .from("contacts")
      .update({ is_archived: archived, updated_at: nowIso })
      .in("id", chunk)
      .select("id");
    if (error) throw new Error(error.message);
    updated += (data || []).length;
  }

  return updated;
}
