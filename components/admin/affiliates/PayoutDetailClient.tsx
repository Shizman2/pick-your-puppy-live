"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markPayoutPaid, voidPayout } from "../../../app/admin/payouts/actions";
import { PAYOUT_STATUS_LABEL, PAYOUT_METHOD_LABEL, type AffiliatePayoutMethod } from "../../../lib/affiliateTypes";
import type { AffiliatePayoutDetail } from "../../../lib/affiliates";
import { formatPriceFromCents } from "../../../lib/puppyTypes";
import { formatDateOnly } from "../../../lib/formatDate";

export default function PayoutDetailClient({ payout }: { payout: AffiliatePayoutDetail }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkPaid() {
    if (!confirm(`Mark this $${(payout.totalAmountCents / 100).toFixed(2)} payout as paid? Its commissions will move to Paid.`)) return;
    setError(null);
    setBusy(true);
    const result = await markPayoutPaid(payout.id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleVoid() {
    const reason = prompt("Reason for voiding this payout (required) - its commissions will return to Approved:");
    if (!reason) return;
    setError(null);
    setBusy(true);
    const result = await voidPayout(payout.id, reason);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 560 }}>
      {error && <div className="inquire-error">{error}</div>}

      <div className="profile-card">
        <div className="profile-header">
          <div>
            <h2 className="admin-card__title" style={{ margin: 0 }}>
              {payout.affiliateName}
            </h2>
            <p className="admin-hint">Created {formatDateOnly(payout.createdAt)}</p>
          </div>
          <span className={`aff-status aff-status--${payout.status}`}>{PAYOUT_STATUS_LABEL[payout.status as keyof typeof PAYOUT_STATUS_LABEL]}</span>
        </div>

        <div className="profit-box">
          <div className="profit-box-total">
            <span>Total</span>
            <span>{formatPriceFromCents(payout.totalAmountCents)}</span>
          </div>
        </div>

        {payout.payoutMethod && (
          <p className="admin-hint">
            Method: {PAYOUT_METHOD_LABEL[payout.payoutMethod as AffiliatePayoutMethod] || payout.payoutMethod}
            {payout.payoutReference ? ` · ${payout.payoutReference}` : ""}
          </p>
        )}
        {payout.paidAt && <p className="admin-hint">Paid {formatDateOnly(payout.paidAt)}</p>}
        {payout.voidedAt && (
          <p className="admin-hint">
            Voided {formatDateOnly(payout.voidedAt)}
            {payout.voidedReason ? ` - ${payout.voidedReason}` : ""}
          </p>
        )}

        {payout.status === "pending" && (
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button type="button" className="admin-btn admin-btn--primary" onClick={handleMarkPaid} disabled={busy}>
              Mark Paid
            </button>
            <button type="button" className="admin-btn admin-btn--danger" onClick={handleVoid} disabled={busy}>
              Void Payout
            </button>
          </div>
        )}
      </div>

      <div className="profile-card">
        <h2 className="admin-card__title">Commissions in this payout</h2>
        {payout.commissions.map((c) => (
          <div key={c.id} className="payment-row">
            <div>
              <div className="payment-row-amount">{formatPriceFromCents(c.amountCents)}</div>
              <div className="payment-row-meta">
                {c.puppyName} · {c.contactName}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
