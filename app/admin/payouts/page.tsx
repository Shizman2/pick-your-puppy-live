import Link from "next/link";
import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import PayoutsListClient from "../../../components/admin/affiliates/PayoutsListClient";
import { getPayoutsListData, type AffiliatePayoutListItem } from "../../../lib/affiliates";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/affiliates/affiliates.css";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  let payouts: AffiliatePayoutListItem[] = [];
  let loadError: string | null = null;

  try {
    payouts = await getPayoutsListData();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading payouts.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="payouts" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <div>
            <h1 className="contacts-title">Payouts</h1>
            <p className="contacts-subtitle">{payouts?.length ?? 0} total</p>
          </div>
          <Link href="/admin/payouts/new" className="admin-btn admin-btn--primary">
            + New Payout
          </Link>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load payouts.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : (
          <PayoutsListClient payouts={payouts || []} />
        )}
      </div>
    </AdminSidebar>
  );
}
