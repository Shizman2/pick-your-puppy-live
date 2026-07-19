import Link from "next/link";
import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import BreederForm from "../../../../components/admin/breeders/BreederForm";
import { getBreederById, getPuppiesForBreeder } from "../../../../lib/breeders";
import type { PuppyRow } from "../../../../lib/puppyTypes";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";
import "../../../../components/admin/breeders/breeders.css";

export const dynamic = "force-dynamic";

export default async function EditBreederPage({ params }: { params: { id: string } }) {
  let breeder = null;
  let linkedPuppies: PuppyRow[] = [];
  let loadError: string | null = null;

  try {
    breeder = await getBreederById(params.id);
    if (breeder) {
      linkedPuppies = await getPuppiesForBreeder(params.id);
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading this breeder.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="breeders" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <h1 className="contacts-title">{breeder?.name || "Edit Breeder"}</h1>
          <p className="contacts-subtitle">
            <Link href="/admin/breeders" className="contacts-back-link">
              ← Back to Breeders
            </Link>
          </p>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load this breeder.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : !breeder ? (
          <div className="contacts-empty">Breeder not found.</div>
        ) : (
          <BreederForm existing={breeder} linkedPuppies={linkedPuppies} />
        )}
      </div>
    </AdminSidebar>
  );
}
