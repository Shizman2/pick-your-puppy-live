"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AffiliateRow } from "../../../lib/affiliateTypes";
import { AFFILIATE_STATUS_LABEL, affiliateDisplayName } from "../../../lib/affiliateTypes";

const FILTERS: { key: AffiliateRow["status"] | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "suspended", label: "Suspended" },
  { key: "rejected", label: "Rejected" },
];

export default function AffiliatesListClient({ affiliates }: { affiliates: AffiliateRow[] }) {
  const [filter, setFilter] = useState<AffiliateRow["status"] | "all">("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: affiliates.length };
    for (const a of affiliates) c[a.status] = (c[a.status] || 0) + 1;
    return c;
  }, [affiliates]);

  const filtered = filter === "all" ? affiliates : affiliates.filter((a) => a.status === filter);

  return (
    <div>
      <div className="contacts-filters">
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

      {filtered.length === 0 ? (
        <div className="contacts-empty">No affiliates in this view.</div>
      ) : (
        <div className="aff-list">
          <div className="aff-row aff-row--header" style={{ gridTemplateColumns: "1.4fr 1.6fr 1fr 1fr 0.9fr" }}>
            <div>Name</div>
            <div>Email</div>
            <div>Referral Code</div>
            <div>Commission</div>
            <div>Status</div>
          </div>
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={`/admin/affiliates/${a.id}`}
              className="aff-row"
              style={{ gridTemplateColumns: "1.4fr 1.6fr 1fr 1fr 0.9fr" }}
            >
              <div className="aff-cell" data-label="Name">
                <span className="aff-name">{affiliateDisplayName(a)}</span>
              </div>
              <div className="aff-cell" data-label="Email">
                {a.email}
              </div>
              <div className="aff-cell" data-label="Code">
                {a.referral_code}
              </div>
              <div className="aff-cell" data-label="Commission">
                {a.commission_type === "flat_cents"
                  ? `$${((a.commission_flat_cents || 0) / 100).toFixed(2)} flat`
                  : `${((a.commission_percent_bp || 0) / 100).toFixed(1)}%`}
              </div>
              <div className="aff-cell" data-label="Status">
                <span className={`aff-status aff-status--${a.status}`}>{AFFILIATE_STATUS_LABEL[a.status]}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
