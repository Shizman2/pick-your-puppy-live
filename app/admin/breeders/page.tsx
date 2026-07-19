import Link from "next/link";
import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import BreedersListClient from "../../../components/admin/breeders/BreedersListClient";
import { getBreedersListData } from "../../../lib/breeders";
import type { BreederRow } from "../../../lib/breederTypes";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/breeders/breeders.css";

export const dynamic = "force-dynamic";

export default async function BreedersPage() {
  let breeders: BreederRow[] = [];
  let loadError: string | null = null;

  try {
    breeders = await getBreedersListData();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading breeders.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="breeders" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <div>
            <h1 className="contacts-title">Breeders</h1>
            <p className="contacts-subtitle">
              {breeders.length} total breeder{breeders.length === 1 ? "" : "s"}
            </p>
          </div>
          <Link href="/admin/breeders/new" className="admin-btn admin-btn--primary">
            + Add Breeder
          </Link>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load breeders.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : (
          <BreedersListClient breeders={breeders} />
        )}
      </div>
    </AdminSidebar>
  );
}
