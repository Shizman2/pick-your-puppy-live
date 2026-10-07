import "server-only";
import { createAdminClient } from "./supabase/admin";

/**
 * Ids of every non-archived contact with at least one unread inbound
 * message - the database form of the shared definition in lib/unread.ts.
 * Pass contactIds to only check those contacts (e.g. one profile page).
 */
export async function getUnreadContactIds(contactIds?: string[]): Promise<Set<string>> {
  const admin = createAdminClient();

  let query = admin
    .from("messages")
    .select("contact_id, contacts!inner(is_archived)")
    .eq("direction", "inbound")
    .eq("is_read", false)
    .eq("contacts.is_archived", false);

  if (contactIds) {
    if (contactIds.length === 0) return new Set();
    query = query.in("contact_id", contactIds);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return new Set(((data || []) as { contact_id: string }[]).map((row) => row.contact_id));
}

/**
 * The admin's unread number: customer conversations (people) waiting
 * on a reply. Used for the sidebar Messages badge on every admin page.
 * Never throws - a failed count shows as 0 rather than breaking the
 * whole page, same as before this definition changed.
 */
export async function getUnreadConversationCount(): Promise<number> {
  try {
    return (await getUnreadContactIds()).size;
  } catch (err) {
    console.error("unread count: failed to load", err instanceof Error ? err.message : err);
    return 0;
  }
}
