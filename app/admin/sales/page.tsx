import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import SalesListClient from "../../../components/admin/sales/SalesListClient";
import { getSalesListData } from "../../../lib/sales";
import type { SaleListItem } from "../../../lib/sales";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/sales/sales.css";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  let sales: SaleListItem[] = [];
  let loadError: string | null = null;

  try {
    sales = await getSalesListData();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading sales.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="sales" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <div>
            <h1 className="contacts-title">Sales & Payments</h1>
            <p className="contacts-subtitle">
              {sales.length} active sale{sales.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load sales.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : (
          <SalesListClient sales={sales} />
        )}
      </div>
    </AdminSidebar>
  );
}
