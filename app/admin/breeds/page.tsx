import Link from "next/link";
import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import BreedsListClient from "../../../components/admin/breeds/BreedsListClient";
import { getBreedsListData } from "../../../lib/breeds";
import type { BreedRow } from "../../../lib/breedTypes";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/breeds/breeds.css";

export const dynamic = "force-dynamic";

export default async function BreedsPage() {
  let breeds: BreedRow[] = [];
  let loadError: string | null = null;

  try {
    breeds = await getBreedsListData();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading breeds.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="breeds" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <div>
            <h1 className="contacts-title">Breeds</h1>
            <p className="contacts-subtitle">
              {breeds.length} breed{breeds.length === 1 ? "" : "s"} - centrally managed, matched to puppies by breed
              name
            </p>
          </div>
          <Link href="/admin/breeds/new" className="admin-btn admin-btn--primary">
            + Add Breed
          </Link>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load breeds.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
            <p style={{ marginTop: 8 }} className="admin-hint">
              If this is a fresh setup, make sure supabase/009_breeds_and_settings.sql has been run.
            </p>
          </div>
        ) : (
          <BreedsListClient breeds={breeds} />
        )}
      </div>
    </AdminSidebar>
  );
}
