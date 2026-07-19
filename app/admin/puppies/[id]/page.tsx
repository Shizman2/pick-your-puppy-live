import Link from "next/link";
import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import PuppyForm from "../../../../components/admin/puppies/PuppyForm";
import { getPuppyById } from "../../../../lib/puppies";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";
import "../../../../components/admin/puppies/puppies.css";

export const dynamic = "force-dynamic";

export default async function EditPuppyPage({ params }: { params: { id: string } }) {
  let puppy = null;
  let loadError: string | null = null;

  try {
    puppy = await getPuppyById(params.id);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading this puppy.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="puppies" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <h1 className="contacts-title">{puppy?.name || "Edit Puppy"}</h1>
          <p className="contacts-subtitle">
            <Link href="/admin/puppies" className="contacts-back-link">
              ← Back to Puppies
            </Link>
          </p>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load this puppy.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : !puppy ? (
          <div className="contacts-empty">Puppy not found.</div>
        ) : (
          <PuppyForm existing={puppy} />
        )}
      </div>
    </AdminSidebar>
  );
}
