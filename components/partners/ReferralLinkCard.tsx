"use client";

import { useState } from "react";
import { generateAffiliateUrl } from "../../lib/affiliateLinks";

/**
 * Deliberately minimal for now - just the link, the code, and a copy
 * button. Not the full Marketing Center (assets, per-puppy links, etc.)
 * that may come later.
 */
export default function ReferralLinkCard({ referralCode }: { referralCode: string }) {
  const [copyLabel, setCopyLabel] = useState("Copy Link");

  const referralLink = generateAffiliateUrl("/", referralCode);

  function handleCopy() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy Link"), 2000);
    });
  }

  return (
    <div className="profile-card" style={{ marginTop: 14, marginBottom: 20 }}>
      <h2 className="admin-card__title">Your Referral Link</h2>
      <div className="aff-referral-link">
        <input className="admin-input" readOnly value={referralLink} onFocus={(e) => e.target.select()} />
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleCopy}>
          {copyLabel}
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        <span className="admin-field__label">Referral Code</span>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{referralCode}</div>
      </div>
    </div>
  );
}
