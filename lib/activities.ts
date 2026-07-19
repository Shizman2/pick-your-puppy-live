import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { ActivityRow } from "./activityTypes";

export interface TaskListItem extends ActivityRow {
  contactName: string;
}

export interface TasksPageData {
  overdue: TaskListItem[];
  today: TaskListItem[];
  upcoming: TaskListItem[];
  noDueDate: TaskListItem[];
}

/** YYYY-MM-DD for "today," in the server's clock. Single-admin, small
 *  business use case - not attempting multi-timezone precision here. */
function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getTasksPageData(): Promise<TasksPageData> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("activities")
    .select("*, contacts(id, first_name, last_name, display_name)")
    .eq("status", "pending")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("due_time", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);

  const today = todayDateString();
  const overdue: TaskListItem[] = [];
  const todayList: TaskListItem[] = [];
  const upcoming: TaskListItem[] = [];
  const noDueDate: TaskListItem[] = [];

  for (const row of (data || []) as Array<
    ActivityRow & { contacts: { id: string; first_name: string; last_name: string | null; display_name: string | null } | null }
  >) {
    const contact = row.contacts;
    const contactName =
      contact?.display_name || `${contact?.first_name ?? ""} ${contact?.last_name ?? ""}`.trim() || "Unknown contact";

    const item: TaskListItem = {
      id: row.id,
      contact_id: row.contact_id,
      activity_type: row.activity_type,
      title: row.title,
      due_date: row.due_date,
      due_time: row.due_time,
      status: row.status,
      completed_at: row.completed_at,
      created_at: row.created_at,
      contactName,
    };

    if (!row.due_date) {
      noDueDate.push(item);
    } else if (row.due_date < today) {
      overdue.push(item);
    } else if (row.due_date === today) {
      todayList.push(item);
    } else {
      upcoming.push(item);
    }
  }

  return { overdue, today: todayList, upcoming, noDueDate };
}

export async function getActivitiesForContact(contactId: string): Promise<ActivityRow[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("activities")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as ActivityRow[];
}
