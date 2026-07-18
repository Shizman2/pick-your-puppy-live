import Link from "next/link";
import Logo from "../../components/public/Logo";
import SignOutButton from "../../components/admin/SignOutButton";
import AdminDashboardForm from "../../components/admin/AdminDashboardForm";
import { getEvent } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Phase 5: real data, real save/publish/upload logic. Fetches the
 * current event row server-side (via the trusted admin client) and
 * hands it to the client form that owns all the editing state.
 */
export default async function AdminPage() {
  const event = await getEvent();

  return (
    <div className="admin-shell">
      <div className="admin-inner">
        <div className="admin-header" style={{ justifyContent: "space-between" }}>
          <Link href="/admin/contacts" className="admin-btn">
            Contacts
          </Link>
          <Logo />
          <SignOutButton />
        </div>

        {event ? (
          <AdminDashboardForm initialEvent={event} />
        ) : (
          <p className="admin-hint">
            No event found. Make sure the SQL migration ran successfully and
            created the &quot;sample-show&quot; row.
          </p>
        )}
      </div>
    </div>
  );
}
