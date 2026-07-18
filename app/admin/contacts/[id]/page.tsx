import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import ContactProfileClient from "../../../../components/admin/contacts/ContactProfileClient";
import { getContactProfileData } from "../../../../lib/contactProfile";
import type { ContactProfileData } from "../../../../lib/contactTypes";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";

export const dynamic = "force-dynamic";

export default async function ContactProfilePage({ params }: { params: { id: string } }) {
  let profile: ContactProfileData | null = null;
  let loadError: string | null = null;

  try {
    profile = await getContactProfileData(params.id);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading contact.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="contacts" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load this contact.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : !profile ? (
          <div className="contacts-empty">
            Contact not found. It may have been deleted, or the link is wrong.
          </div>
        ) : (
          <ContactProfileClient profile={profile} />
        )}
      </div>
    </AdminSidebar>
  );
}
