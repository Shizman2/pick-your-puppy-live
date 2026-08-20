import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import ProposalEditor from "../../../../components/admin/puppy-finder/ProposalEditor";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import { createPuppyFinderReadClient } from "../../../../lib/puppyFinderAccess";
import type { PuppyFinderOptionRow, PuppyFinderProposalRow } from "../../../../lib/puppyFinderTypes";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";

export const dynamic = "force-dynamic";

export default async function ProposalEditorPage({ params }: { params: { proposalId: string } }) {
  const admin = createPuppyFinderReadClient();
  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  const { data: proposal } = await admin
    .from("puppy_finder_proposals")
    .select("*")
    .eq("id", params.proposalId)
    .maybeSingle();

  if (!proposal) {
    return (
      <AdminSidebar active="contacts" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
        <div className="contacts-page">
          <div className="contacts-empty">
            Proposal not found. It may have been deleted, or the link is wrong.
          </div>
        </div>
      </AdminSidebar>
    );
  }

  const [{ data: options }, { data: contact }] = await Promise.all([
    admin
      .from("puppy_finder_options")
      .select("*")
      .eq("proposal_id", proposal.id)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    admin
      .from("contacts")
      .select("id, first_name, last_name, display_name")
      .eq("id", proposal.contact_id)
      .maybeSingle(),
  ]);

  const contactName =
    contact?.display_name || `${contact?.first_name || ""} ${contact?.last_name || ""}`.trim() || "Contact";

  return (
    <AdminSidebar active="contacts" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <ProposalEditor
          proposal={proposal as PuppyFinderProposalRow}
          options={(options || []) as PuppyFinderOptionRow[]}
          contactName={contactName}
        />
      </div>
    </AdminSidebar>
  );
}
