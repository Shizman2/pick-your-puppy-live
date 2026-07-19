import Link from "next/link";
import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import PuppyForm from "../../../../components/admin/puppies/PuppyForm";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";
import "../../../../components/admin/puppies/puppies.css";

export const dynamic = "force-dynamic";

export default async function NewPuppyPage() {
  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="puppies" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <h1 className="contacts-title">Add Puppy</h1>
          <p className="contacts-subtitle">
            <Link href="/admin/puppies" className="contacts-back-link">
              ← Back to Puppies
            </Link>
          </p>
        </div>
        <PuppyForm />
      </div>
    </AdminSidebar>
  );
}
