import Link from "next/link";
import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import BreederForm from "../../../../components/admin/breeders/BreederForm";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";
import "../../../../components/admin/breeders/breeders.css";

export const dynamic = "force-dynamic";

export default async function NewBreederPage() {
  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="breeders" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <h1 className="contacts-title">Add Breeder</h1>
          <p className="contacts-subtitle">
            <Link href="/admin/breeders" className="contacts-back-link">
              ← Back to Breeders
            </Link>
          </p>
        </div>
        <BreederForm />
      </div>
    </AdminSidebar>
  );
}
