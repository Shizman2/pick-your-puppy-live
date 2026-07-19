"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { ACTIVITY_TYPE_LABEL, type ActivityType } from "../../../lib/activityTypes";

export type ActionResult = { success: true } | { success: false; error: string };

async function requireAdminSession() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
}

/**
 * Recomputes contacts.next_follow_up_at from that contact's own
 * pending activities (the earliest due_date/due_time still pending),
 * or clears it if none remain. This is the "sync behind the scenes"
 * behavior - the field itself, and the Contacts list filtering built
 * around it, are untouched otherwise.
 */
async function syncNextFollowUp(contactId: string) {
  const admin = createAdminClient();

  const { data } = await admin
    .from("activities")
    .select("due_date, due_time")
    .eq("contact_id", contactId)
    .eq("status", "pending")
    .not("due_date", "is", null)
    .order("due_date", { ascending: true })
    .order("due_time", { ascending: true, nullsFirst: true })
    .limit(1)
    .maybeSingle();

  let nextFollowUpAt: string | null = null;
  if (data?.due_date) {
    const timePart = data.due_time || "09:00:00";
    nextFollowUpAt = new Date(`${data.due_date}T${timePart}`).toISOString();
  }

  await admin.from("contacts").update({ next_follow_up_at: nextFollowUpAt }).eq("id", contactId);
}

export async function createActivity(
  contactId: string,
  fields: {
    activityType: ActivityType;
    title: string;
    dueDate: string | null;
    dueTime: string | null;
  }
): Promise<ActionResult> {
  try {
    await requireAdminSession();

    if (!fields.title.trim()) {
      return { success: false, error: "Please enter a title for this activity." };
    }

    const admin = createAdminClient();
    const { error } = await admin.from("activities").insert({
      contact_id: contactId,
      activity_type: fields.activityType,
      title: fields.title.trim(),
      due_date: fields.dueDate || null,
      due_time: fields.dueTime || null,
      status: "pending",
    });

    if (error) return { success: false, error: error.message };

    await syncNextFollowUp(contactId);

    revalidatePath("/admin/tasks");
    revalidatePath(`/admin/contacts/${contactId}`);
    revalidatePath("/admin/contacts");

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function completeActivity(activityId: string): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const admin = createAdminClient();

    const { data: activity, error: fetchError } = await admin
      .from("activities")
      .select("*")
      .eq("id", activityId)
      .maybeSingle();

    if (fetchError) return { success: false, error: fetchError.message };
    if (!activity) return { success: false, error: "Activity not found." };

    const now = new Date().toISOString();

    const { error: updateError } = await admin
      .from("activities")
      .update({ status: "completed", completed_at: now })
      .eq("id", activityId);

    if (updateError) return { success: false, error: updateError.message };

    await admin.from("timeline_events").insert({
      contact_id: activity.contact_id,
      event_type: "activity_completed",
      description: `Completed: ${ACTIVITY_TYPE_LABEL[activity.activity_type as ActivityType] || activity.activity_type} - ${activity.title}`,
      metadata: { activity_id: activity.id, activity_type: activity.activity_type },
    });

    await syncNextFollowUp(activity.contact_id);

    revalidatePath("/admin/tasks");
    revalidatePath(`/admin/contacts/${activity.contact_id}`);
    revalidatePath("/admin/contacts");

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
