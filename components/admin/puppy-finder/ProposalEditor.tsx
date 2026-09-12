"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmDepositReceived, deleteProposalPermanently } from "../../../app/admin/puppy-finder/actions";
import { PROPOSAL_STATUS_LABEL } from "../../../lib/puppyFinderTypes";
import type { PuppyFinderOptionRow, PuppyFinderProposalRow } from "../../../lib/puppyFinderTypes";
import OptionForm from "./OptionForm";
import "./puppy-finder-admin.css";

export default function ProposalEditor({
  proposal,
  options,
  contactName,
}: {
  proposal: PuppyFinderProposalRow;
  options: PuppyFinderOptionRow[];
  contactName: string;
}) {
  const router = useRouter();
  // Exactly one form can be open at a time across the whole card: "new"
  // for the Add Puppy Option panel, an option's id for that option's
  // edit form, or null for nothing open. This is what guarantees the
  // add form and an edit form (or two edit forms) can never be open
  // simultaneously - previously each OptionForm tracked its own open/
  // closed state independently, so nothing stopped that.
  const [activeForm, setActiveForm] = useState<string | "new" | null>(null);
  const [status, setStatus] = useState(proposal.status);
  const [depositConfirmedAt, setDepositConfirmedAt] = useState(proposal.deposit_confirmed_at);
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy Link");
  const [error, setError] = useState<string | null>(null);

  const resultsUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/puppy-finder/results/${proposal.access_token}`
      : `/puppy-finder/results/${proposal.access_token}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(resultsUrl).then(() => {
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy Link"), 2000);
    });
  }

  function handleConfirmDeposit() {
    setError(null);
    const priceInput = prompt("Sale price for this puppy, in dollars (e.g. 1800):");
    if (priceInput === null) return;
    const priceNum = parseFloat(priceInput);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Enter a valid sale price to confirm the deposit and start the sale.");
      return;
    }

    startTransition(async () => {
      const result = await confirmDepositReceived(proposal.id, Math.round(priceNum * 100));
      if (!result.success) {
        setError(result.error);
        return;
      }
      setStatus("deposit_confirmed");
      setDepositConfirmedAt(new Date().toISOString());
      router.push(`/admin/sales/${result.saleId}`);
    });
  }

  async function handleDeleteProposal() {
    if (
      !confirm(
        `Permanently delete this entire proposal for ${contactName}, including all ${options.length} puppy option(s) on it? The private link will stop working immediately. This can't be undone.`
      )
    ) {
      return;
    }
    setError(null);
    setDeleting(true);
    const result = await deleteProposalPermanently(proposal.id, proposal.contact_id);
    setDeleting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(`/admin/contacts/${proposal.contact_id}`);
  }

  return (
    <div className="profile">
      <div className="profile-card">
        <Link
          href={`/admin/contacts/${proposal.contact_id}`}
          className="admin-hint"
          style={{ display: "inline-block", marginBottom: 10 }}
        >
          ← Back to {contactName}
        </Link>
        <h1 className="contacts-title">Puppy Finder Proposal</h1>
        <p className="contacts-subtitle">{contactName}</p>

        <div className="pf-status-row">
          <span className={`pf-status-pill pf-status-pill--${status}`}>{PROPOSAL_STATUS_LABEL[status]}</span>
          {depositConfirmedAt && (
            <span className="admin-hint">Confirmed {new Date(depositConfirmedAt).toLocaleString()}</span>
          )}
        </div>

        <div className="admin-field" style={{ marginTop: 14 }}>
          <label className="admin-field__label">Private link for this customer</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="admin-input" readOnly value={resultsUrl} onFocus={(e) => e.target.select()} />
            <button type="button" className="admin-btn" onClick={handleCopyLink}>
              {copyLabel}
            </button>
          </div>
          <p className="admin-hint" style={{ marginTop: 6 }}>
            Send this link to the customer manually (text or email). It doesn&apos;t expire and always shows their
            latest options and status.
          </p>
        </div>

        {error && <div className="inquire-error">{error}</div>}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {status === "selected" && (
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={handleConfirmDeposit}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Confirm Deposit Received"}
            </button>
          )}
          <button type="button" className="admin-btn admin-btn--danger" onClick={handleDeleteProposal} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Proposal"}
          </button>
        </div>
      </div>

      <div className="profile-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h2 className="admin-card__title" style={{ margin: 0 }}>
            Puppy Options
          </h2>
          <button
            type="button"
            className="admin-btn"
            onClick={() => setActiveForm((prev) => (prev === "new" ? null : "new"))}
          >
            {activeForm === "new" ? "Cancel" : "+ Add Puppy Option"}
          </button>
        </div>

        {activeForm === "new" && <OptionForm proposalId={proposal.id} onDone={() => setActiveForm(null)} />}

        {options.length === 0 && activeForm !== "new" && <p className="contacts-muted">No puppy options added yet.</p>}

        {options.map((option) => (
          <OptionForm
            key={option.id}
            proposalId={proposal.id}
            existing={option}
            isOpen={activeForm === option.id}
            onOpen={() => setActiveForm(option.id)}
            onDone={() => setActiveForm(null)}
          />
        ))}
      </div>
    </div>
  );
}
