import { redirect } from "next/navigation";
import { requireAffiliateUser } from "../../../lib/authz";
import { getAffiliateById, getAffiliatePortalStats } from "../../../lib/affiliates";
import PartnersShell from "../../../components/partners/PartnersShell";
import { formatPriceFromCents } from "../../../lib/puppyTypes";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/sales/sales.css";
import "../../../components/admin/affiliates/affiliates.css";

export const dynamic = "force-dynamic";

export default async function PartnersDashboardPage() {
  const auth = await requireAffiliateUser();
  if (!auth.ok) redirect("/partners/login");

  const [affiliate, stats] = await Promise.all([
    getAffiliateById(auth.affiliateId),
    getAffiliatePortalStats(auth.affiliateId),
  ]);

  const referralLink = affiliate ? `https://thepuppyplugs.com/?ref=${affiliate.referral_code}` : "";

  return (
    <PartnersShell>
      <h1 className="contacts-title">Dashboard</h1>
      {affiliate && (
        <div className="admin-field" style={{ marginTop: 14, marginBottom: 20 }}>
          <label className="admin-field__label">Your referral link</label>
          <div className="aff-referral-link">
            <input className="admin-input" readOnly value={referralLink} onFocus={(e) => e.target.select()} />
          </div>
        </div>
      )}

      <div className="partners-stat-grid">
        <div className="partners-stat-card">
          <div className="partners-stat-value">{stats.totalClicks}</div>
          <div className="partners-stat-label">Clicks</div>
        </div>
        <div className="partners-stat-card">
          <div className="partners-stat-value">{stats.referredContacts}</div>
          <div className="partners-stat-label">Referred Contacts</div>
        </div>
        <div className="partners-stat-card">
          <div className="partners-stat-value">{stats.totalSales}</div>
          <div className="partners-stat-label">Sales</div>
        </div>
        <div className="partners-stat-card">
          <div className="partners-stat-value">{(stats.conversionRate * 100).toFixed(0)}%</div>
          <div className="partners-stat-label">Conversion</div>
        </div>
      </div>

      <div className="profile-card">
        <h2 className="admin-card__title">Commission Totals</h2>
        <div className="profit-box-line">
          <span>Pending</span>
          <span>{formatPriceFromCents(stats.commissionTotalsCents.pending || 0)}</span>
        </div>
        <div className="profit-box-line">
          <span>Approved</span>
          <span>{formatPriceFromCents(stats.commissionTotalsCents.approved || 0)}</span>
        </div>
        <div className="profit-box-line">
          <span>In Payout</span>
          <span>{formatPriceFromCents(stats.commissionTotalsCents.in_payout || 0)}</span>
        </div>
        <div className="profit-box-total">
          <span>Paid (lifetime)</span>
          <span>{formatPriceFromCents(stats.commissionTotalsCents.paid || 0)}</span>
        </div>
      </div>
    </PartnersShell>
  );
}
