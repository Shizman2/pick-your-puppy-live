import "server-only";
import webpush from "web-push";
import { createAdminClient } from "./supabase/admin";
import type { AdminNotificationPreferencesRow, NotificationEventType, PushNotificationPayload, PushSubscriptionRow } from "./pushTypes";
import { NOTIFICATION_PREFERENCE_KEY } from "./pushTypes";

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contactEmail = process.env.VAPID_CONTACT_EMAIL;

  if (!publicKey || !privateKey || !contactEmail) {
    console.error("Web Push not configured: missing VAPID env vars. Skipping push send.");
    return false;
  }

  webpush.setVapidDetails(`mailto:${contactEmail}`, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/**
 * Sends one payload to a specific list of subscriptions, marking each as
 * used or deleting it if the push service reports it as expired/invalid
 * (404/410). Never throws - errors are logged and swallowed so a push
 * failure can never break whatever triggered it. Shared by the
 * event-driven sender below and by the manual "Send Test Notification"
 * action, which targets a single admin's own devices directly.
 */
export async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionRow[],
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  if (!ensureVapidConfigured() || subscriptions.length === 0) return { sent: 0, failed: 0 };

  const admin = createAdminClient();
  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    tag: payload.tag,
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        notificationPayload
      )
    )
  );

  const expiredIds: string[] = [];
  const usedIds: string[] = [];

  results.forEach((result, i) => {
    const sub = subscriptions[i];
    if (result.status === "fulfilled") {
      usedIds.push(sub.id);
      return;
    }
    const err = result.reason as { statusCode?: number; message?: string };
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      expiredIds.push(sub.id);
    } else {
      console.error(`push: send failed for subscription ${sub.id}`, err?.message || err);
    }
  });

  if (usedIds.length > 0) {
    await admin.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).in("id", usedIds);
  }
  if (expiredIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return { sent: usedIds.length, failed: expiredIds.length + results.filter((r) => r.status === "rejected").length - expiredIds.length };
}

/**
 * Sends a push notification to every enabled admin device subscribed to
 * this event type. This is an alert layer, not the source of truth -
 * it never throws, so a Web Push failure (missing config, expired
 * subscription, network error) can never break the caller's request.
 */
export async function sendPushToAdmins(
  eventType: NotificationEventType,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    if (!ensureVapidConfigured()) return;

    const admin = createAdminClient();

    const [{ data: subscriptions, error: subsError }, { data: preferences, error: prefsError }] = await Promise.all([
      admin.from("push_subscriptions").select("*").eq("enabled", true),
      admin.from("admin_notification_preferences").select("*"),
    ]);

    if (subsError) {
      console.error("push: failed to load subscriptions", subsError.message);
      return;
    }
    if (prefsError) {
      console.error("push: failed to load notification preferences", prefsError.message);
      return;
    }

    const prefsByAdmin = new Map<string, AdminNotificationPreferencesRow>(
      ((preferences || []) as AdminNotificationPreferencesRow[]).map((p) => [p.admin_user_id, p])
    );
    const prefKey = NOTIFICATION_PREFERENCE_KEY[eventType];

    const eligible = ((subscriptions || []) as PushSubscriptionRow[]).filter((sub) => {
      const prefs = prefsByAdmin.get(sub.admin_user_id);
      // No preferences row yet = defaults apply (all event types on).
      return prefs ? prefs[prefKey] : true;
    });

    if (eligible.length === 0) return;

    await sendPushToSubscriptions(eligible, payload);
  } catch (err) {
    console.error("push: unexpected error sending notifications", err);
  }
}

/** Truncates and strips newlines from customer-submitted text before it goes into a notification. */
export function sanitizeForNotification(value: string | null | undefined, maxLength = 60): string {
  if (!value) return "";
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, maxLength);
}
