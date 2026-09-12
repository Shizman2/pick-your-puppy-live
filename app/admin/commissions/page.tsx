import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import CommissionsListClient from "../../../components/admin/affiliates/CommissionsListClient";
import { getAllCommissionsListData, type AffiliateCommissionListItem } from "../../../lib/affiliates";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/sales/sales.css";
import "../../../components/admin/affiliates/affiliates.css";

export const dynamic = "force-dynamic";

export default async function CommissionsPage() {
  let commissions: (AffiliateCommissionListItem & { affiliateName: string; affiliateId: string })[] = [];
  let loadError: string | null = null;

  try {
    commissions = await getAllCommissionsListData();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading commissions.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="commissions" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <div>
            <h1 className="contacts-title">Commissions</h1>
            <p className="contacts-subtitle">{commissions?.length ?? 0} total</p>
          </div>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load commissions.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : (
          <CommissionsListClient commissions={commissions || []} />
        )}
      </div>
    </AdminSidebar>
  );
}
