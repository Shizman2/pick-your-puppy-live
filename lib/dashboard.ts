import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { ContactStatus } from "./contactTypes";

const STATUS_ORDER: ContactStatus[] = [
  "new",
  "contacted",
  "interested",
  "follow_up",
  "reserved",
  "customer",
  "closed",
];

interface MiniContact {
  id: string;
  first_name: string;
  last_name: string | null;
  display_name: string | null;
  status: ContactStatus;
  interest_level: string | null;
  last_activity_at: string | null;
  needs_duplicate_review: boolean;
  created_at: string;
}

export interface DashboardData {
  newContactsThisWeek: number;
  unreadMessages: number;
  activitiesDueTodayOrOverdue: number;
  highInterestCount: number;
  pipeline: { status: ContactStatus; count: number }[];
  needsAttention: {
    overdueActivities: { id: string; title: string; contactId: string; contactName: string; dueDate: string }[];
    staleUnread: { contactId: string; contactName: string; lastMessageAt: string }[];
    staleHighInterest: { contactId: string; contactName: string; lastActivityAt: string | null }[];
    possibleDuplicates: { contactId: string; contactName: string }[];
  };
  recentActivity: { id: string; description: string; contactId: string; contactName: string; createdAt: string }[];
}

/**
 * Every number here comes from a real table that actually exists.
 * There is no revenue, sales, payments, or puppy-inventory data yet -
 * those systems aren't built, so nothing about them appears here,
 * not even as a placeholder zero pretending to be real.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const admin = createAdminClient();

  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 86400000).toISOString();
  const oneDayAgo = new Date(now - 86400000).toISOString();
  const threeDaysAgo = new Date(now - 3 * 86400000).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: contactsData, error: contactsError }, { data: activitiesData, error: activitiesError }, { data: messagesData, error: messagesError }, { data: timelineData, error: timelineError }] =
    await Promise.all([
      admin
        .from("contacts")
        .select(
          "id, first_name, last_name, display_name, status, interest_level, last_activity_at, needs_duplicate_review, created_at"
        ),
      admin
        .from("activities")
        .select("id, contact_id, title, due_date, status")
        .eq("status", "pending"),
      admin
        .from("messages")
        .select("id, contact_id, direction, is_read, created_at")
        .eq("direction", "inbound"),
      admin
        .from("timeline_events")
        .select("id, contact_id, description, event_type, created_at")
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

  if (contactsError) throw new Error(contactsError.message);
  if (activitiesError) throw new Error(activitiesError.message);
  if (messagesError) throw new Error(messagesError.message);
  if (timelineError) throw new Error(timelineError.message);

  const contacts = (contactsData || []) as MiniContact[];
  const contactNameById = new Map<string, string>();
  for (const c of contacts) {
    contactNameById.set(c.id, c.display_name || `${c.first_name} ${c.last_name || ""}`.trim());
  }

  const newContactsThisWeek = contacts.filter((c) => c.created_at >= sevenDaysAgo).length;
  const highInterestCount = contacts.filter((c) => c.interest_level === "high").length;

  const pipeline = STATUS_ORDER.map((status) => ({
    status,
    count: contacts.filter((c) => c.status === status).length,
  }));

  const activities = activitiesData || [];
  const activitiesDueTodayOrOverdue = activities.filter((a) => a.due_date && a.due_date <= today).length;

  const overdueActivities = activities
    .filter((a) => a.due_date && a.due_date < today)
    .slice(0, 10)
    .map((a) => ({
      id: a.id,
      title: a.title,
      contactId: a.contact_id,
      contactName: contactNameById.get(a.contact_id) || "Unknown contact",
      dueDate: a.due_date as string,
    }));

  const inboundMessages = messagesData || [];
  const unreadMessages = inboundMessages.filter((m) => !m.is_read).length;

  const staleUnreadByContact = new Map<string, string>();
  for (const m of inboundMessages) {
    if (!m.is_read && m.created_at < oneDayAgo) {
      const existing = staleUnreadByContact.get(m.contact_id);
      if (!existing || m.created_at < existing) {
        staleUnreadByContact.set(m.contact_id, m.created_at);
      }
    }
  }
  const staleUnread = Array.from(staleUnreadByContact.entries())
    .slice(0, 10)
    .map(([contactId, lastMessageAt]) => ({
      contactId,
      contactName: contactNameById.get(contactId) || "Unknown contact",
      lastMessageAt,
    }));

  const staleHighInterest = contacts
    .filter(
      (c) =>
        c.interest_level === "high" &&
        c.status !== "customer" &&
        c.status !== "closed" &&
        (!c.last_activity_at || c.last_activity_at < threeDaysAgo)
    )
    .slice(0, 10)
    .map((c) => ({
      contactId: c.id,
      contactName: contactNameById.get(c.id) || "Unknown contact",
      lastActivityAt: c.last_activity_at,
    }));

  const possibleDuplicates = contacts
    .filter((c) => c.needs_duplicate_review)
    .slice(0, 10)
    .map((c) => ({ contactId: c.id, contactName: contactNameById.get(c.id) || "Unknown contact" }));

  const recentActivity = (timelineData || []).map((t) => ({
    id: t.id,
    description: t.description || t.event_type,
    contactId: t.contact_id,
    contactName: contactNameById.get(t.contact_id) || "Unknown contact",
    createdAt: t.created_at,
  }));

  return {
    newContactsThisWeek,
    unreadMessages,
    activitiesDueTodayOrOverdue,
    highInterestCount,
    pipeline,
    needsAttention: { overdueActivities, staleUnread, staleHighInterest, possibleDuplicates },
    recentActivity,
  };
}

export interface PuppyStatusBreakdown {
  total: number;
  available: number;
  hold: number;
  sold: number;
}

export async function getPuppyStatusBreakdown(): Promise<PuppyStatusBreakdown> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("puppies").select("status");

  if (error) throw new Error(error.message);

  const rows = data || [];
  return {
    total: rows.length,
    // on_sale and discounted are still purchasable inventory - just
    // merchandised differently - so they count as Available here,
    // same as the live website treats them (visible, not sold/hold).
    available: rows.filter((p) => p.status === "available" || p.status === "on_sale" || p.status === "discounted")
      .length,
    hold: rows.filter((p) => p.status === "hold").length,
    sold: rows.filter((p) => p.status === "sold").length,
  };
}

export interface TodayActivityItem {
  id: string;
  title: string;
  contactName: string;
  contactId: string;
  dueTime: string | null;
}

export async function getTodayActivities(): Promise<TodayActivityItem[]> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await admin
    .from("activities")
    .select("id, title, due_time, contact_id, contacts(first_name, last_name, display_name)")
    .eq("status", "pending")
    .eq("due_date", today)
    .order("due_time", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => {
    const contact = row.contacts;
    return {
      id: row.id,
      title: row.title,
      contactName: contact?.display_name || `${contact?.first_name ?? ""} ${contact?.last_name ?? ""}`.trim() || "Unknown",
      contactId: row.contact_id,
      dueTime: row.due_time,
    };
  });
}
