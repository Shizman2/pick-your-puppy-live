import Link from "next/link";
import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import BreedForm from "../../../../components/admin/breeds/BreedForm";
import { getBreedById } from "../../../../lib/breeds";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";
import "../../../../components/admin/breeds/breeds.css";

export const dynamic = "force-dynamic";

export default async function EditBreedPage({ params }: { params: { id: string } }) {
  let breed = null;
  let loadError: string | null = null;

  try {
    breed = await getBreedById(params.id);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading this breed.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="breeds" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <h1 className="contacts-title">{breed?.name || "Edit Breed"}</h1>
          <p className="contacts-subtitle">
            <Link href="/admin/breeds" className="contacts-back-link">
              ← Back to Breeds
            </Link>
          </p>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load this breed.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : !breed ? (
          <div className="contacts-empty">Breed not found.</div>
        ) : (
          <BreedForm existing={breed} />
        )}
      </div>
    </AdminSidebar>
  );
}
