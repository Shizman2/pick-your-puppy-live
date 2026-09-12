"use client";

import Link from "next/link";
import { PAYOUT_STATUS_LABEL } from "../../../lib/affiliateTypes";
import { formatPriceFromCents } from "../../../lib/puppyTypes";
import { formatDateOnly } from "../../../lib/formatDate";
import type { AffiliatePayoutListItem } from "../../../lib/affiliates";

export default function PayoutsListClient({ payouts }: { payouts: AffiliatePayoutListItem[] }) {
  if (payouts.length === 0) {
    return <div className="contacts-empty">No payouts yet.</div>;
  }

  return (
    <div className="aff-list">
      <div className="aff-row aff-row--header" style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr" }}>
        <div>Affiliate</div>
        <div>Total</div>
        <div>Status</div>
        <div>Created</div>
      </div>
      {payouts.map((p) => (
        <Link key={p.id} href={`/admin/payouts/${p.id}`} className="aff-row" style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr" }}>
          <div className="aff-cell" data-label="Affiliate">
            {p.affiliateName}
          </div>
          <div className="aff-cell" data-label="Total">
            {formatPriceFromCents(p.totalAmountCents)}
          </div>
          <div className="aff-cell" data-label="Status">
            <span className={`aff-status aff-status--${p.status}`}>{PAYOUT_STATUS_LABEL[p.status as keyof typeof PAYOUT_STATUS_LABEL]}</span>
          </div>
          <div className="aff-cell" data-label="Created">
            {formatDateOnly(p.createdAt)}
          </div>
        </Link>
      ))}
    </div>
  );
}
