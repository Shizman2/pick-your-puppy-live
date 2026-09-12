import Link from "next/link";
import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import PayoutDetailClient from "../../../../components/admin/affiliates/PayoutDetailClient";
import { getPayoutById } from "../../../../lib/affiliates";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";
import "../../../../components/admin/sales/sales.css";
import "../../../../components/admin/affiliates/affiliates.css";

export const dynamic = "force-dynamic";

export default async function PayoutDetailPage({ params }: { params: { id: string } }) {
  let payout = null;
  let loadError: string | null = null;

  try {
    payout = await getPayoutById(params.id);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading this payout.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="payouts" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <h1 className="contacts-title">Payout</h1>
          <p className="contacts-subtitle">
            <Link href="/admin/payouts" className="contacts-back-link">
              ← Back to Payouts
            </Link>
          </p>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load this payout.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : !payout ? (
          <div className="contacts-empty">Payout not found.</div>
        ) : (
          <PayoutDetailClient payout={payout} />
        )}
      </div>
    </AdminSidebar>
  );
}
