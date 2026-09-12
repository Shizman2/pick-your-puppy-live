"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  approveAffiliate,
  rejectAffiliate,
  suspendAffiliate,
  reinstateAffiliate,
  updateAffiliateCommissionSettings,
  updateAffiliatePayoutInfo,
  updateAffiliateAdminNotes,
  voidAllUnpaidCommissionsForAffiliate,
} from "../../../app/admin/affiliates/actions";
import type { AffiliateCommissionListItem } from "../../../lib/affiliates";
import type { AffiliateRow, AffiliateCommissionType, AffiliatePayoutMethod } from "../../../lib/affiliateTypes";
import { AFFILIATE_STATUS_LABEL, COMMISSION_STATUS_LABEL, PAYOUT_METHOD_OPTIONS, PAYOUT_METHOD_LABEL, affiliateDisplayName } from "../../../lib/affiliateTypes";
import { formatPriceFromCents } from "../../../lib/puppyTypes";
import { formatDateOnly } from "../../../lib/formatDate";

export default function AffiliateDetailClient({
  affiliate,
  commissions,
}: {
  affiliate: AffiliateRow;
  commissions: AffiliateCommissionListItem[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [commissionType, setCommissionType] = useState<AffiliateCommissionType>(affiliate.commission_type);
  const [flatCents, setFlatCents] = useState(affiliate.commission_flat_cents ? (affiliate.commission_flat_cents / 100).toString() : "");
  const [percentBp, setPercentBp] = useState(affiliate.commission_percent_bp ? (affiliate.commission_percent_bp / 100).toString() : "");

  const [payoutMethod, setPayoutMethod] = useState<AffiliatePayoutMethod | "">(affiliate.payout_method || "");
  const [payoutHandle, setPayoutHandle] = useState(affiliate.payout_handle || "");
  const [payoutNotes, setPayoutNotes] = useState(affiliate.payout_notes || "");

  const [notes, setNotes] = useState(affiliate.notes || "");

  const referralLink =
    typeof window !== "undefined" ? `${window.location.origin}/?ref=${affiliate.referral_code}` : `/?ref=${affiliate.referral_code}`;

  async function run(fn: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (!result.success) {
      setError(result.error || "Something went wrong.");
      return;
    }
    router.refresh();
  }

  async function handleApprove() {
    if (!confirm(`Approve ${affiliateDisplayName(affiliate)}? This sends them an email to set up their login.`)) return;
    setError(null);
    setBusy(true);
    const result = await approveAffiliate(affiliate.id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (result.linkedExistingAccount) {
      alert(
        "This email already had an account, so no invite email was sent - the affiliate role was added to that existing account. They can log in with their existing password."
      );
    }
    router.refresh();
  }

  async function handleReject() {
    const reason = prompt("Reason for rejecting this application (optional):") || "";
    await run(() => rejectAffiliate(affiliate.id, reason));
  }

  async function handleSuspend() {
    const reason = prompt("Reason for suspending this affiliate (required):");
    if (!reason) return;
    await run(() => suspendAffiliate(affiliate.id, reason));
  }

  async function handleReinstate() {
    await run(() => reinstateAffiliate(affiliate.id));
  }

  async function handleSaveCommission() {
    await run(() =>
      updateAffiliateCommissionSettings(affiliate.id, {
        type: commissionType,
        flatCents: flatCents ? Math.round(parseFloat(flatCents) * 100) : null,
        percentBp: percentBp ? Math.round(parseFloat(percentBp) * 100) : null,
      })
    );
  }

  async function handleSavePayoutInfo() {
    await run(() => updateAffiliatePayoutInfo(affiliate.id, { method: payoutMethod || null, handle: payoutHandle, notes: payoutNotes }));
  }

  async function handleSaveNotes() {
    await run(() => updateAffiliateAdminNotes(affiliate.id, notes));
  }

  async function handleBulkVoid() {
    const reason = prompt("Reason for voiding every unpaid commission for this affiliate (required):");
    if (!reason) return;
    if (!confirm("Void every pending/approved/in-payout commission for this affiliate? Paid commissions are never affected.")) return;
    await run(() => voidAllUnpaidCommissionsForAffiliate(affiliate.id, reason));
  }

  return (
    <div style={{ maxWidth: 640 }}>
      {error && <div className="inquire-error">{error}</div>}

      <div className="profile-card">
        <div className="profile-header">
          <div>
            <h2 className="admin-card__title" style={{ margin: 0 }}>
              {affiliateDisplayName(affiliate)}
            </h2>
            <p className="admin-hint">{affiliate.email}</p>
          </div>
          <span className={`aff-status aff-status--${affiliate.status}`}>{AFFILIATE_STATUS_LABEL[affiliate.status]}</span>
        </div>

        {affiliate.status === "approved" && (
          <div className="admin-field">
            <label className="admin-field__label">Referral link</label>
            <div className="aff-referral-link">
              <input className="admin-input" readOnly value={referralLink} onFocus={(e) => e.target.select()} />
              <button type="button" className="admin-btn" onClick={() => navigator.clipboard.writeText(referralLink)}>
                Copy
              </button>
            </div>
          </div>
        )}

        {affiliate.phone && <p className="admin-hint">Phone: {affiliate.phone}</p>}
        {affiliate.social_url && (
          <p className="admin-hint">
            Social: <a href={affiliate.social_url} target="_blank" rel="noreferrer">{affiliate.social_url}</a>
          </p>
        )}
        {affiliate.promotion_plan && <p className="admin-hint">Promotion plan: {affiliate.promotion_plan}</p>}
        {affiliate.application_notes && <p className="admin-hint">Applicant notes: {affiliate.application_notes}</p>}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          {affiliate.status === "pending" && (
            <>
              <button type="button" className="admin-btn admin-btn--primary" onClick={handleApprove} disabled={busy}>
                Approve
              </button>
              <button type="button" className="admin-btn admin-btn--danger" onClick={handleReject} disabled={busy}>
                Reject
              </button>
            </>
          )}
          {affiliate.status === "approved" && (
            <button type="button" className="admin-btn admin-btn--danger" onClick={handleSuspend} disabled={busy}>
              Suspend
            </button>
          )}
          {affiliate.status === "suspended" && (
            <>
              <p className="admin-hint" style={{ width: "100%" }}>
                Suspended {affiliate.suspended_at && formatDateOnly(affiliate.suspended_at)}
                {affiliate.suspended_reason ? ` - ${affiliate.suspended_reason}` : ""}
              </p>
              <button type="button" className="admin-btn admin-btn--primary" onClick={handleReinstate} disabled={busy}>
                Reinstate
              </button>
            </>
          )}
          {affiliate.status === "rejected" && affiliate.rejected_reason && (
            <p className="admin-hint">Rejected: {affiliate.rejected_reason}</p>
          )}
        </div>
      </div>

      <div className="profile-card">
        <h2 className="admin-card__title">Commission Rate</h2>
        <div className="puppy-form-row">
          <div className="admin-field">
            <label className="admin-field__label">Type</label>
            <select className="admin-select" value={commissionType} onChange={(e) => setCommissionType(e.target.value as AffiliateCommissionType)}>
              <option value="percent_bp">Percent of sale price</option>
              <option value="flat_cents">Flat amount per sale</option>
            </select>
          </div>
          {commissionType === "percent_bp" ? (
            <div className="admin-field">
              <label className="admin-field__label">Percent (%)</label>
              <input className="admin-input" type="number" value={percentBp} onChange={(e) => setPercentBp(e.target.value)} />
            </div>
          ) : (
            <div className="admin-field">
              <label className="admin-field__label">Flat amount ($)</label>
              <input className="admin-input" type="number" value={flatCents} onChange={(e) => setFlatCents(e.target.value)} />
            </div>
          )}
        </div>
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleSaveCommission} disabled={busy}>
          Save Commission Rate
        </button>
      </div>

      <div className="profile-card">
        <h2 className="admin-card__title">Payout Information</h2>
        <p className="admin-hint" style={{ marginBottom: 10 }}>
          Minimum info needed to manually send money - no bank account or routing numbers are ever stored here.
        </p>
        <div className="puppy-form-row">
          <div className="admin-field">
            <label className="admin-field__label">Method</label>
            <select className="admin-select" value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value as AffiliatePayoutMethod)}>
              <option value="">Not set</option>
              {PAYOUT_METHOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {PAYOUT_METHOD_LABEL[m]}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-field__label">Handle (cashtag, email, phone...)</label>
            <input className="admin-input" value={payoutHandle} onChange={(e) => setPayoutHandle(e.target.value)} />
          </div>
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Notes (optional)</label>
          <input className="admin-input" value={payoutNotes} onChange={(e) => setPayoutNotes(e.target.value)} />
        </div>
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleSavePayoutInfo} disabled={busy}>
          Save Payout Info
        </button>
      </div>

      <div className="profile-card">
        <h2 className="admin-card__title">Admin Notes</h2>
        <div className="admin-field">
          <textarea className="admin-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button type="button" className="admin-btn" onClick={handleSaveNotes} disabled={busy}>
          Save Notes
        </button>
      </div>

      <div className="profile-card">
        <h2 className="admin-card__title">Commissions</h2>
        {commissions.length === 0 ? (
          <p className="admin-hint">No commissions yet.</p>
        ) : (
          commissions.map((c) => (
            <div key={c.id} className="payment-row">
              <div>
                <div className="payment-row-amount">
                  {formatPriceFromCents(c.amountCents)}
                  {c.flaggedAfterClose && <span className="aff-flagged-badge">Review</span>}
                </div>
                <div className="payment-row-meta">
                  {c.puppyName} · {c.contactName}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className={`aff-status aff-status--${c.status}`}>{COMMISSION_STATUS_LABEL[c.status as keyof typeof COMMISSION_STATUS_LABEL]}</span>
                <div className="payment-row-meta">
                  <Link href={`/admin/sales/${c.saleId}`}>View sale</Link>
                </div>
              </div>
            </div>
          ))
        )}
        {commissions.some((c) => ["pending", "approved", "in_payout"].includes(c.status)) && (
          <button type="button" className="admin-btn admin-btn--danger" onClick={handleBulkVoid} disabled={busy} style={{ marginTop: 12 }}>
            Void All Unpaid Commissions
          </button>
        )}
      </div>
    </div>
  );
}
