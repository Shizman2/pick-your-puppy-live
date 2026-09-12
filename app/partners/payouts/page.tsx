import { redirect } from "next/navigation";
import { createAdminClient } from "../../../lib/supabase/admin";
import { requireAffiliateUser } from "../../../lib/authz";
import PartnersShell from "../../../components/partners/PartnersShell";
import { PAYOUT_STATUS_LABEL, type PayoutStatus } from "../../../lib/affiliateTypes";
import { formatPriceFromCents } from "../../../lib/puppyTypes";
import { formatDateOnly } from "../../../lib/formatDate";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/affiliates/affiliates.css";

export const dynamic = "force-dynamic";

export default async function PartnersPayoutsPage() {
  const auth = await requireAffiliateUser();
  if (!auth.ok) redirect("/partners/login");

  const admin = createAdminClient();
  const { data: payouts } = await admin
    .from("affiliate_payouts")
    .select("id, status, total_amount_cents, created_at, paid_at")
    .eq("affiliate_id", auth.affiliateId)
    .order("created_at", { ascending: false });

  return (
    <PartnersShell>
      <h1 className="contacts-title">Payouts</h1>
      {!payouts || payouts.length === 0 ? (
        <div className="contacts-empty">No payouts yet.</div>
      ) : (
        <div className="aff-list" style={{ marginTop: 16 }}>
          <div className="aff-row aff-row--header" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div>Total</div>
            <div>Status</div>
            <div>Created</div>
          </div>
          {payouts.map((p) => (
            <div key={p.id} className="aff-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              <div className="aff-cell" data-label="Total">
                {formatPriceFromCents(p.total_amount_cents)}
              </div>
              <div className="aff-cell" data-label="Status">
                <span className={`aff-status aff-status--${p.status}`}>{PAYOUT_STATUS_LABEL[p.status as PayoutStatus]}</span>
              </div>
              <div className="aff-cell" data-label="Created">
                {formatDateOnly(p.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </PartnersShell>
  );
}
