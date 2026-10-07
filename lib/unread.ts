/**
 * The admin's ONE definition of "unread", shared by every screen.
 *
 * The number the admin sees (sidebar Messages badge, Message Center
 * heading, dashboard) is the number of CUSTOMER CONVERSATIONS / PEOPLE
 * waiting on a reply - i.e. non-archived contacts with at least one
 * inbound message where is_read = false. A customer with 3 unread
 * messages counts as 1, not 3. Archived contacts never count.
 *
 * This file holds the pure pieces (safe to import from client
 * components). The database-backed version that every server page
 * uses is getUnreadConversationCount() / getUnreadContactIds() in
 * lib/unreadCount.ts, which applies exactly this same rule in SQL.
 */

/** Whether a single message is an unread message from the customer. */
export function isUnreadInbound(message: { direction: string; is_read: boolean }): boolean {
  return message.direction === "inbound" && !message.is_read;
}

/**
 * Counts conversations (people) with at least one unread inbound
 * message, from per-conversation unread message counts. Callers must
 * only pass non-archived conversations - the Message Center list
 * already excludes archived contacts (lib/messageCenter.ts).
 */
export function countUnreadConversations(items: { unreadCount: number }[]): number {
  return items.filter((item) => item.unreadCount > 0).length;
}
