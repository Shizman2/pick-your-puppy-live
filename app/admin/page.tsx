import AdminSidebar from "../../components/admin/layout/AdminSidebar";
import AdminDashboardForm from "../../components/admin/AdminDashboardForm";
import { getEvent } from "./actions";
import { getAdminUserEmail } from "../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../lib/unreadCount";
import "../../components/admin/layout/adminShell.css";

export const dynamic = "force-dynamic";

/**
 * This page is the Pick Your Puppy Live event/countdown admin
 * (date/time, banner, homepage display, publish controls). In the
 * sidebar it's labeled "Pick Your Puppy Live", not "Dashboard" - the
 * real business Dashboard (revenue, sales pipeline, recent activity)
 * doesn't exist yet and isn't faked here; its nav item is marked
 * "Coming soon" until it's actually built.
 */
export default async function AdminPage() {
  const event = await getEvent();
  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="pypl" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="admin-inner" style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Pick Your Puppy Live</h1>
        <p className="admin-hint" style={{ marginBottom: 20 }}>
          Manage the show date, homepage display, and countdown page.
        </p>

        {event ? (
          <AdminDashboardForm initialEvent={event} />
        ) : (
          <p className="admin-hint">
            No event found. Make sure the SQL migration ran successfully and
            created the &quot;sample-show&quot; row.
          </p>
        )}
      </div>
    </AdminSidebar>
  );
}
