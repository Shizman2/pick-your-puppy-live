import Link from "next/link";
import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import PuppiesListClient from "../../../components/admin/puppies/PuppiesListClient";
import { getPuppiesListData } from "../../../lib/puppies";
import type { PuppyRow } from "../../../lib/puppyTypes";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/puppies/puppies.css";

export const dynamic = "force-dynamic";

export default async function PuppiesPage() {
  let puppies: PuppyRow[] = [];
  let loadError: string | null = null;

  try {
    puppies = await getPuppiesListData();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading puppies.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="puppies" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <div>
            <h1 className="contacts-title">Puppies</h1>
            <p className="contacts-subtitle">
              {puppies.length} total puppy{puppies.length === 1 ? "" : " listings"}
            </p>
          </div>
          <Link href="/admin/puppies/new" className="admin-btn admin-btn--primary">
            + Add Puppy
          </Link>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load puppies.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : (
          <PuppiesListClient puppies={puppies} />
        )}
      </div>
    </AdminSidebar>
  );
}
