"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { sendPushToSubscriptions } from "../../../lib/push";
import type { AdminNotificationPreferencesRow, PushSubscriptionRow } from "../../../lib/pushTypes";

export type ActionResult = { success: true } | { success: false; error: string };

async function requireAdminUserId(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  return { ok: true, userId: user.id };
}

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  authKey: string;
  deviceLabel: string;
}

export async function subscribeToPush(input: PushSubscriptionInput): Promise<ActionResult> {
  const auth = await requireAdminUserId();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      admin_user_id: auth.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth_key: input.authKey,
      device_label: input.deviceLabel,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function unsubscribeFromPush(subscriptionId: string): Promise<ActionResult> {
  const auth = await requireAdminUserId();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("push_subscriptions")
    .delete()
    .eq("id", subscriptionId)
    .eq("admin_user_id", auth.userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateNotificationPreferences(
  prefs: Partial<
    Pick<
      AdminNotificationPreferencesRow,
      | "notify_reservation_requests"
      | "notify_puppy_finder_requests"
      | "notify_contact_messages"
      | "notify_puppy_inquiries"
      | "notify_puppy_finder_selections"
    >
  >
): Promise<ActionResult> {
  const auth = await requireAdminUserId();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("admin_notification_preferences")
    .upsert(
      { admin_user_id: auth.userId, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: "admin_user_id" }
    );

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function sendTestNotification(): Promise<ActionResult> {
  const auth = await requireAdminUserId();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("admin_user_id", auth.userId)
    .eq("enabled", true);

  if (error) return { success: false, error: error.message };
  if (!data || data.length === 0) {
    return { success: false, error: "No devices are registered for push notifications yet." };
  }

  const { sent } = await sendPushToSubscriptions(data as PushSubscriptionRow[], {
    title: "The Puppy Plugs",
    body: "Push notifications are working.",
    url: "/admin/settings",
    tag: "test-notification",
  });

  if (sent === 0) {
    return { success: false, error: "Couldn't deliver to any of your devices. They may need to be re-enabled." };
  }

  return { success: true };
}
