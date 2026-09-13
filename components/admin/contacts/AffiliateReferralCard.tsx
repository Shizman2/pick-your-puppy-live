"use client";

import { useState } from "react";
import Link from "next/link";
import type { ContactAttributionHistoryItem } from "../../../lib/affiliateAttribution";
import { formatShortDate } from "../../../lib/formatRelative";

/**
 * Display-only (no reassignment UI exists yet - see blueprint: manual
 * reassignment is a later decision). Shows the currently-valid
 * attribution prominently, with the full ledger tucked into a
 * collapsed <details> so this doesn't compete for attention with the
 * rest of the profile.
 */
export default function AffiliateReferralCard({ history }: { history: ContactAttributionHistoryItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const current = history.find((h) => h.isCurrent);

  return (
    <div className="profile-card">
      <h2 className="admin-card__title">Affiliate Referral</h2>

      {current ? (
        <div className="profile-info-grid">
          <div>
            <span className="profile-info-label">Referred By</span>
            <span className="profile-info-value">
              <Link href={`/admin/affiliates/${current.affiliateId}`}>{current.affiliateName}</Link>
            </span>
          </div>
          <div>
            <span className="profile-info-label">Referral Code</span>
            <span className="profile-info-value">{current.referralCode}</span>
          </div>
          <div>
            <span className="profile-info-label">Attribution Date</span>
            <span className="profile-info-value">{formatShortDate(current.attributedAt)}</span>
          </div>
          <div>
            <span className="profile-info-label">Expires</span>
            <span className="profile-info-value">{formatShortDate(current.expiresAt)}</span>
          </div>
        </div>
      ) : (
        <div className="profile-info-value">Referred By: Organic / None</div>
      )}

      {history.length > (current ? 1 : 0) && (
        <div style={{ marginTop: 12 }}>
          <button type="button" className="admin-btn" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Hide history" : `History (${history.length})`}
          </button>
          {expanded && (
            <ul className="profile-timeline" style={{ marginTop: 10 }}>
              {history.map((h) => (
                <li key={h.id} className="profile-timeline-item">
                  <div className="profile-timeline-dot" />
                  <div>
                    <p className="profile-timeline-desc" style={{ textTransform: "none" }}>
                      {h.affiliateName} ({h.referralCode}) - {h.source === "click" ? "referral click" : "manual"}
                      {h.isCurrent ? " - current" : ""}
                    </p>
                    <span className="profile-timeline-time">
                      {formatShortDate(h.attributedAt)} - expires {formatShortDate(h.expiresAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
