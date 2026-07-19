import Link from "next/link";
import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import StartSaleForm from "../../../../components/admin/sales/StartSaleForm";
import { getPuppyById } from "../../../../lib/puppies";
import { getContactsListData } from "../../../../lib/contactsList";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";
import "../../../../components/admin/sales/sales.css";

export const dynamic = "force-dynamic";

export default async function NewSalePage({ searchParams }: { searchParams: { puppyId?: string } }) {
  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  if (!searchParams.puppyId) {
    return (
      <AdminSidebar active="sales" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
        <div className="contacts-page">
          <div className="contacts-empty">
            Start a sale from a puppy&apos;s edit page - go to{" "}
            <Link href="/admin/puppies" className="contacts-back-link">
              Puppies
            </Link>{" "}
            first.
          </div>
        </div>
      </AdminSidebar>
    );
  }

  const puppy = await getPuppyById(searchParams.puppyId);
  const contacts = await getContactsListData();

  return (
    <AdminSidebar active="sales" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <h1 className="contacts-title">Start a Sale</h1>
          <p className="contacts-subtitle">
            <Link href={`/admin/puppies/${searchParams.puppyId}`} className="contacts-back-link">
              ← Back to Puppy
            </Link>
          </p>
        </div>

        {!puppy ? (
          <div className="contacts-empty">Puppy not found.</div>
        ) : (
          <StartSaleForm puppy={puppy} contacts={contacts} />
        )}
      </div>
    </AdminSidebar>
  );
}
