import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import ContactsListClient from "../../../components/admin/contacts/ContactsListClient";
import { getContactsListData } from "../../../lib/contactsList";
import type { ContactListItem } from "../../../lib/contactTypes";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  let contacts: ContactListItem[];
  let loadError: string | null = null;

  try {
    contacts = await getContactsListData();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading contacts.";
    contacts = [];
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="contacts" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      {loadError ? (
        <div className="contacts-empty" style={{ textAlign: "left" }}>
          <strong>Couldn&apos;t load contacts.</strong>
          <p style={{ marginTop: 8 }}>
            <code>{loadError}</code>
          </p>
          <p style={{ marginTop: 8 }}>
            If this mentions a missing column (like <code>is_read</code> or{" "}
            <code>is_active</code>), the Supabase migration
            (<code>supabase/003_puppy_os_core_schema.sql</code>) hasn&apos;t been run
            yet against the live database.
          </p>
        </div>
      ) : (
        <ContactsListClient contacts={contacts} />
      )}
    </AdminSidebar>
  );
}
