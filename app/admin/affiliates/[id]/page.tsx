import Link from "next/link";
import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import AffiliateDetailClient from "../../../../components/admin/affiliates/AffiliateDetailClient";
import { getAffiliateById, getCommissionsForAffiliate, type AffiliateCommissionListItem } from "../../../../lib/affiliates";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";
import "../../../../components/admin/puppies/puppies.css";
import "../../../../components/admin/sales/sales.css";
import "../../../../components/admin/affiliates/affiliates.css";

export const dynamic = "force-dynamic";

export default async function AffiliateDetailPage({ params }: { params: { id: string } }) {
  let affiliate = null;
  let commissions: AffiliateCommissionListItem[] = [];
  let loadError: string | null = null;

  try {
    affiliate = await getAffiliateById(params.id);
    if (affiliate) commissions = await getCommissionsForAffiliate(params.id);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading this affiliate.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="affiliates" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <h1 className="contacts-title">Affiliate</h1>
          <p className="contacts-subtitle">
            <Link href="/admin/affiliates" className="contacts-back-link">
              ← Back to Affiliates
            </Link>
          </p>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load this affiliate.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : !affiliate ? (
          <div className="contacts-empty">Affiliate not found.</div>
        ) : (
          <AffiliateDetailClient affiliate={affiliate} commissions={commissions} />
        )}
      </div>
    </AdminSidebar>
  );
}
