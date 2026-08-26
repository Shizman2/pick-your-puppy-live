import Link from "next/link";
import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import BreedForm from "../../../../components/admin/breeds/BreedForm";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";
import "../../../../components/admin/breeds/breeds.css";

export const dynamic = "force-dynamic";

export default async function NewBreedPage() {
  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="breeds" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <h1 className="contacts-title">Add Breed</h1>
          <p className="contacts-subtitle">
            <Link href="/admin/breeds" className="contacts-back-link">
              ← Back to Breeds
            </Link>
          </p>
        </div>
        <BreedForm />
      </div>
    </AdminSidebar>
  );
}
