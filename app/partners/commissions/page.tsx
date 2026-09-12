import { redirect } from "next/navigation";
import { requireAffiliateUser } from "../../../lib/authz";
import { getCommissionsForAffiliate } from "../../../lib/affiliates";
import PartnersShell from "../../../components/partners/PartnersShell";
import { COMMISSION_STATUS_LABEL, type CommissionStatus } from "../../../lib/affiliateTypes";
import { formatPriceFromCents } from "../../../lib/puppyTypes";
import { formatDateOnly } from "../../../lib/formatDate";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/sales/sales.css";
import "../../../components/admin/affiliates/affiliates.css";

export const dynamic = "force-dynamic";

export default async function PartnersCommissionsPage() {
  const auth = await requireAffiliateUser();
  if (!auth.ok) redirect("/partners/login");

  const commissions = await getCommissionsForAffiliate(auth.affiliateId);

  return (
    <PartnersShell>
      <h1 className="contacts-title">Commissions</h1>
      <p className="contacts-subtitle" style={{ marginBottom: 16 }}>
        A commission stays Pending until the 10-day veterinary hold period passes AND the sale is paid in full.
      </p>
      {commissions.length === 0 ? (
        <div className="contacts-empty">No commissions yet - share your referral link to get started.</div>
      ) : (
        commissions.map((c) => (
          <div key={c.id} className="payment-row">
            <div>
              <div className="payment-row-amount">{formatPriceFromCents(c.amountCents)}</div>
              <div className="payment-row-meta">
                {c.puppyName} · {c.contactName} · {formatDateOnly(c.createdAt)}
              </div>
            </div>
            <span className={`aff-status aff-status--${c.status}`}>{COMMISSION_STATUS_LABEL[c.status as CommissionStatus]}</span>
          </div>
        ))
      )}
    </PartnersShell>
  );
}
