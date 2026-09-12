"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPayout } from "../../../app/admin/payouts/actions";
import { PAYOUT_METHOD_OPTIONS, PAYOUT_METHOD_LABEL, affiliateDisplayName, type AffiliateRow } from "../../../lib/affiliateTypes";
import type { ApprovedCommissionOption } from "../../../lib/affiliates";
import { formatPriceFromCents } from "../../../lib/puppyTypes";

export default function NewPayoutForm({
  affiliates,
  commissionsByAffiliate,
}: {
  affiliates: AffiliateRow[];
  commissionsByAffiliate: Record<string, ApprovedCommissionOption[]>;
}) {
  const router = useRouter();
  const [affiliateId, setAffiliateId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commissions = affiliateId ? commissionsByAffiliate[affiliateId] || [] : [];
  const total = useMemo(
    () => commissions.filter((c) => selectedIds.has(c.id)).reduce((sum, c) => sum + c.amountCents, 0),
    [commissions, selectedIds]
  );

  function handleSelectAffiliate(id: string) {
    setAffiliateId(id);
    setSelectedIds(new Set());
  }

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);
    if (!affiliateId) {
      setError("Select an affiliate.");
      return;
    }
    if (selectedIds.size === 0) {
      setError("Select at least one approved commission.");
      return;
    }

    setSaving(true);
    const result = await createPayout(affiliateId, Array.from(selectedIds), method, reference);
    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(`/admin/payouts/${result.payoutId}`);
  }

  return (
    <div className="profile-card" style={{ maxWidth: 560 }}>
      {error && <div className="inquire-error">{error}</div>}

      <div className="admin-field">
        <label className="admin-field__label">Affiliate</label>
        <select className="admin-select" value={affiliateId} onChange={(e) => handleSelectAffiliate(e.target.value)}>
          <option value="">Select an affiliate...</option>
          {affiliates.map((a) => (
            <option key={a.id} value={a.id}>
              {affiliateDisplayName(a)} ({(commissionsByAffiliate[a.id] || []).length} approved)
            </option>
          ))}
        </select>
      </div>

      {affiliateId && (
        <div className="admin-field">
          <label className="admin-field__label">Approved commissions</label>
          {commissions.length === 0 ? (
            <p className="admin-hint">No approved commissions for this affiliate right now.</p>
          ) : (
            commissions.map((c) => (
              <label key={c.id} className="aff-checkbox-row">
                <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggle(c.id)} />
                <span style={{ flex: 1 }}>
                  {c.puppyName} · {c.contactName}
                </span>
                <strong>{formatPriceFromCents(c.amountCents)}</strong>
              </label>
            ))
          )}
        </div>
      )}

      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Method</label>
          <select className="admin-select" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">Not set</option>
            {PAYOUT_METHOD_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {PAYOUT_METHOD_LABEL[m]}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Reference (optional)</label>
          <input className="admin-input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. confirmation #" />
        </div>
      </div>

      <div className="profit-box">
        <div className="profit-box-total">
          <span>Total</span>
          <span>{formatPriceFromCents(total)}</span>
        </div>
      </div>

      <button type="button" className="admin-btn admin-btn--primary" onClick={handleSubmit} disabled={saving}>
        {saving ? "Creating..." : "Create Payout"}
      </button>
    </div>
  );
}
