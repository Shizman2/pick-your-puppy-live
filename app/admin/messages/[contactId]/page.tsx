import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import MessageCenterClient from "../../../../components/admin/messages/MessageCenterClient";
import { getMessageCenterData } from "../../../../lib/messageCenter";
import type { MessageCenterData } from "../../../../lib/messageCenter";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";
import "../../../../components/admin/messages/messageCenter.css";

export const dynamic = "force-dynamic";

/**
 * Stable direct-link route to one contact's conversation (e.g. from the
 * dashboard's Recent Activity, or the contact profile's "Open in
 * Message Center" link) - replaces the old client-side "#contactId"
 * hash approach with a real, server-renderable URL.
 */
export default async function MessageThreadPage({ params }: { params: { contactId: string } }) {
  let data: MessageCenterData = { list: [], detailsByContactId: {} };
  let loadError: string | null = null;

  try {
    data = await getMessageCenterData();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading messages.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = data.list.reduce((sum, i) => sum + i.unreadCount, 0);

  return (
    <AdminSidebar active="messages" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      {loadError ? (
        <div className="contacts-page">
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load messages.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        </div>
      ) : (
        <MessageCenterClient
          list={data.list}
          detailsByContactId={data.detailsByContactId}
          initialSelectedId={params.contactId}
        />
      )}
    </AdminSidebar>
  );
}
