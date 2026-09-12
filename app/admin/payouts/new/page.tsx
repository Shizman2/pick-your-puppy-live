import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import NewPayoutForm from "../../../../components/admin/affiliates/NewPayoutForm";
import { getAffiliatesListData, getApprovedCommissionsForAffiliate } from "../../../../lib/affiliates";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";
import "../../../../components/admin/puppies/puppies.css";
import "../../../../components/admin/affiliates/affiliates.css";

export const dynamic = "force-dynamic";

export default async function NewPayoutPage() {
  const allAffiliates = await getAffiliatesListData();
  const approvedAffiliates = allAffiliates.filter((a) => a.status === "approved");

  const commissionsByAffiliate: Record<string, Awaited<ReturnType<typeof getApprovedCommissionsForAffiliate>>> = {};
  for (const affiliate of approvedAffiliates) {
    commissionsByAffiliate[affiliate.id] = await getApprovedCommissionsForAffiliate(affiliate.id);
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="payouts" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <h1 className="contacts-title">New Payout</h1>
        </div>
        <NewPayoutForm affiliates={approvedAffiliates} commissionsByAffiliate={commissionsByAffiliate} />
      </div>
    </AdminSidebar>
  );
}
