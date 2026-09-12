import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import AffiliatesListClient from "../../../components/admin/affiliates/AffiliatesListClient";
import { getAffiliatesListData } from "../../../lib/affiliates";
import type { AffiliateRow } from "../../../lib/affiliateTypes";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/affiliates/affiliates.css";

export const dynamic = "force-dynamic";

export default async function AffiliatesPage() {
  let affiliates: AffiliateRow[] = [];
  let loadError: string | null = null;

  try {
    affiliates = await getAffiliatesListData();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading affiliates.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="affiliates" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <div>
            <h1 className="contacts-title">Affiliates</h1>
            <p className="contacts-subtitle">{affiliates?.length ?? 0} total</p>
          </div>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load affiliates.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : (
          <AffiliatesListClient affiliates={affiliates || []} />
        )}
      </div>
    </AdminSidebar>
  );
}
