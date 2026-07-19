import Link from "next/link";
import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import SaleDetailClient from "../../../../components/admin/sales/SaleDetailClient";
import { getSaleById } from "../../../../lib/sales";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";
import "../../../../components/admin/sales/sales.css";

export const dynamic = "force-dynamic";

export default async function SaleDetailPage({ params }: { params: { id: string } }) {
  let detail = null;
  let loadError: string | null = null;

  try {
    detail = await getSaleById(params.id);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading this sale.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="sales" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <h1 className="contacts-title">Sale Details</h1>
          <p className="contacts-subtitle">
            <Link href="/admin/sales" className="contacts-back-link">
              ← Back to Sales
            </Link>
          </p>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load this sale.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : !detail ? (
          <div className="contacts-empty">Sale not found.</div>
        ) : (
          <SaleDetailClient detail={detail} />
        )}
      </div>
    </AdminSidebar>
  );
}
