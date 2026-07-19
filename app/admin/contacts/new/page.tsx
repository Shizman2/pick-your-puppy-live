import Link from "next/link";
import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import AddContactForm from "../../../../components/admin/contacts/AddContactForm";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";

export const dynamic = "force-dynamic";

export default async function NewContactPage() {
  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="contacts" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <h1 className="contacts-title">New Contact</h1>
          <p className="contacts-subtitle">
            <Link href="/admin/contacts" className="contacts-back-link">
              ← Back to Contacts
            </Link>
          </p>
        </div>
        <AddContactForm />
      </div>
    </AdminSidebar>
  );
}
