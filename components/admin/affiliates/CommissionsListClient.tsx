"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { voidCommission, manuallyApproveCommission, runAutoApprovalNow } from "../../../app/admin/commissions/actions";
import { COMMISSION_STATUS_LABEL, type CommissionStatus } from "../../../lib/affiliateTypes";
import { formatPriceFromCents } from "../../../lib/puppyTypes";
import { formatDateOnly } from "../../../lib/formatDate";
import type { AffiliateCommissionListItem } from "../../../lib/affiliates";

const FILTERS: { key: CommissionStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "in_payout", label: "In Payout" },
  { key: "paid", label: "Paid" },
  { key: "void", label: "Void" },
];

type Row = AffiliateCommissionListItem & { affiliateName: string; affiliateId: string };

export default function CommissionsListClient({ commissions }: { commissions: Row[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<CommissionStatus | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [runningCheck, setRunningCheck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: commissions.length };
    for (const row of commissions) c[row.status] = (c[row.status] || 0) + 1;
    return c;
  }, [commissions]);

  const filtered = filter === "all" ? commissions : commissions.filter((c) => c.status === filter);

  async function handleVoid(id: string) {
    const reason = prompt("Reason for voiding this commission (required):");
    if (!reason) return;
    setBusyId(id);
    const result = await voidCommission(id, reason);
    setBusyId(null);
    if (!result.success) setError(result.error);
    else router.refresh();
  }

  async function handleManualApprove(id: string) {
    const reason = prompt("Reason for manually approving this commission before its normal eligibility is met (required):");
    if (!reason) return;
    setBusyId(id);
    const result = await manuallyApproveCommission(id, reason);
    setBusyId(null);
    if (!result.success) setError(result.error);
    else router.refresh();
  }

  async function handleRunCheck() {
    setRunningCheck(true);
    const result = await runAutoApprovalNow();
    setRunningCheck(false);
    if (!result.success) setError(result.error);
    else router.refresh();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
        <div className="contacts-filters" style={{ marginBottom: 0 }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`contacts-filter-chip${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="contacts-filter-count">{counts[f.key] || 0}</span>
            </button>
          ))}
        </div>
        <button type="button" className="admin-btn" onClick={handleRunCheck} disabled={runningCheck}>
          {runningCheck ? "Checking..." : "Run Eligibility Check Now"}
        </button>
      </div>

      {error && <div className="inquire-error">{error}</div>}

      {filtered.length === 0 ? (
        <div className="contacts-empty">No commissions in this view.</div>
      ) : (
        <div className="aff-list">
          <div className="aff-row aff-row--header" style={{ gridTemplateColumns: "1.3fr 1.5fr 0.9fr 1fr 0.9fr 1.4fr" }}>
            <div>Affiliate</div>
            <div>Sale</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Created</div>
            <div>Actions</div>
          </div>
          {filtered.map((c) => (
            <div key={c.id} className="aff-row" style={{ gridTemplateColumns: "1.3fr 1.5fr 0.9fr 1fr 0.9fr 1.4fr" }}>
              <div className="aff-cell" data-label="Affiliate">
                <Link href={`/admin/affiliates/${c.affiliateId}`}>{c.affiliateName}</Link>
              </div>
              <div className="aff-cell" data-label="Sale">
                <Link href={`/admin/sales/${c.saleId}`}>
                  {c.puppyName} · {c.contactName}
                </Link>
              </div>
              <div className="aff-cell" data-label="Amount">
                {formatPriceFromCents(c.amountCents)}
              </div>
              <div className="aff-cell" data-label="Status">
                <span className={`aff-status aff-status--${c.status}`}>{COMMISSION_STATUS_LABEL[c.status as CommissionStatus]}</span>
                {c.flaggedAfterClose && <span className="aff-flagged-badge">Review</span>}
              </div>
              <div className="aff-cell" data-label="Created">
                {formatDateOnly(c.createdAt)}
              </div>
              <div className="aff-cell" data-label="Actions">
                {c.status === "pending" && (
                  <button type="button" className="admin-btn" onClick={() => handleManualApprove(c.id)} disabled={busyId === c.id} style={{ marginRight: 6 }}>
                    Approve Now
                  </button>
                )}
                {["pending", "approved", "in_payout"].includes(c.status) && (
                  <button type="button" className="admin-btn admin-btn--danger" onClick={() => handleVoid(c.id)} disabled={busyId === c.id}>
                    Void
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
