import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import NotificationSettingsClient from "../../../components/admin/settings/NotificationSettingsClient";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import type { AdminNotificationPreferencesRow, PushSubscriptionRow } from "../../../lib/pushTypes";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/settings/settings.css";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let subscriptions: PushSubscriptionRow[] = [];
  let preferences: AdminNotificationPreferencesRow | null = null;
  let loadError: string | null = null;

  if (user) {
    try {
      const admin = createAdminClient();
      const [{ data: subsData, error: subsError }, { data: prefsData, error: prefsError }] = await Promise.all([
        admin
          .from("push_subscriptions")
          .select("*")
          .eq("admin_user_id", user.id)
          .order("created_at", { ascending: false }),
        admin.from("admin_notification_preferences").select("*").eq("admin_user_id", user.id).maybeSingle(),
      ]);

      if (subsError) throw new Error(subsError.message);
      if (prefsError) throw new Error(prefsError.message);

      subscriptions = (subsData || []) as PushSubscriptionRow[];
      preferences = (prefsData as AdminNotificationPreferencesRow | null) || null;
    } catch (err) {
      loadError = err instanceof Error ? err.message : "Unknown error loading notification settings.";
    }
  }

  return (
    <AdminSidebar active="settings" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <div>
            <h1 className="contacts-title">Settings</h1>
            <p className="contacts-subtitle">Manage admin notifications for ThePuppyPlugs.com.</p>
          </div>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load notification settings.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
            <p style={{ marginTop: 8 }} className="admin-hint">
              If this is a fresh setup, make sure supabase/005_push_notifications.sql has been run.
            </p>
          </div>
        ) : (
          <NotificationSettingsClient subscriptions={subscriptions} preferences={preferences} />
        )}
      </div>
    </AdminSidebar>
  );
}
