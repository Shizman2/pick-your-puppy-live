"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProposal } from "../../../app/admin/puppy-finder/actions";
import { PROPOSAL_STATUS_LABEL } from "../../../lib/puppyFinderTypes";
import type { PuppyFinderProposalRow } from "../../../lib/puppyFinderTypes";
import type { PuppyFinderInquiryOption } from "../../../lib/contactTypes";
import "../puppy-finder/puppy-finder-admin.css";

export default function PuppyFinderProposalsCard({
  contactId,
  proposals,
  finderInquiries,
}: {
  contactId: string;
  proposals: PuppyFinderProposalRow[];
  finderInquiries: PuppyFinderInquiryOption[];
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  // finderInquiries is ordered most-recent-first, so this preselects the
  // contact's most recent Puppy Finder request without requiring one.
  const [selectedInquiryId, setSelectedInquiryId] = useState(finderInquiries[0]?.id || "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createProposal(contactId, selectedInquiryId || null);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/admin/puppy-finder/${result.proposalId}`);
    });
  }

  return (
    <div className="profile-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 className="admin-card__title" style={{ margin: 0 }}>
          Puppy Finder Proposals
        </h2>
        <button type="button" className="admin-btn" onClick={() => setShowNew((s) => !s)}>
          {showNew ? "Cancel" : "+ New Proposal"}
        </button>
      </div>

      {showNew && (
        <div className="pf-new-proposal">
          {finderInquiries.length > 0 && (
            <div className="admin-field">
              <label className="admin-field__label">Link to a Puppy Finder request (optional)</label>
              <select
                className="admin-select"
                value={selectedInquiryId}
                onChange={(e) => setSelectedInquiryId(e.target.value)}
              >
                <option value="">Not linked to a specific request</option>
                {finderInquiries.map((inq) => (
                  <option key={inq.id} value={inq.id}>
                    {inq.breed || "Any breed"} · {new Date(inq.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          )}
          {error && <div className="inquire-error">{error}</div>}
          <button type="button" className="admin-btn admin-btn--primary" onClick={handleCreate} disabled={isPending}>
            {isPending ? "Creating..." : "Create Proposal"}
          </button>
        </div>
      )}

      {proposals.length === 0 ? (
        <p className="contacts-muted">No Puppy Finder proposals yet.</p>
      ) : (
        <ul className="pf-proposal-list">
          {proposals.map((p) => (
            <li key={p.id} className="pf-proposal-row">
              <a href={`/admin/puppy-finder/${p.id}`} className="pf-proposal-link">
                Proposal from {new Date(p.created_at).toLocaleDateString()}
              </a>
              <span className={`pf-status-pill pf-status-pill--${p.status}`}>{PROPOSAL_STATUS_LABEL[p.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
