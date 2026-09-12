"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  logPayment,
  updatePayment,
  deletePayment,
  cancelSale,
  refundSale,
  updateFulfillment,
} from "../../../app/admin/sales/actions";
import {
  generateBillOfSale,
  generateHealthGuarantee,
  generateRefundPolicy,
  generatePuppyPurchaseAcknowledgement,
} from "../../../app/admin/documents/actions";
import type { SaleDetail } from "../../../lib/sales";
import type { GeneratedDocumentListItem } from "../../../lib/documents";
import { formatPriceFromCents } from "../../../lib/puppyTypes";
import { formatDateOnly } from "../../../lib/formatDate";
import {
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_LABEL,
  PAYMENT_TYPE_OPTIONS,
  PAYMENT_TYPE_LABEL,
  SALE_PROGRESS_LABEL,
  type PaymentMethod,
  type PaymentType,
  type PaymentRow,
} from "../../../lib/saleTypes";
import {
  FULFILLMENT_METHOD_OPTIONS,
  FULFILLMENT_STATUS_OPTIONS,
  COMMISSION_STATUS_LABEL,
  type FulfillmentMethod,
  type FulfillmentStatus,
} from "../../../lib/affiliateTypes";

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SaleDetailClientProps {
  detail: SaleDetail;
  documents: GeneratedDocumentListItem[];
}

export default function SaleDetailClient({ detail, documents }: SaleDetailClientProps) {
  const router = useRouter();
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash_app");
  const [type, setType] = useState<PaymentType>("deposit");
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState(todayDateInput());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const [fulfillMethod, setFulfillMethod] = useState<FulfillmentMethod | "">(detail.sale.fulfillment_method || "");
  const [fulfillStatus, setFulfillStatus] = useState<FulfillmentStatus>(detail.sale.fulfillment_status);
  const [scheduledAt, setScheduledAt] = useState(detail.sale.scheduled_fulfillment_at?.slice(0, 10) || "");
  const [fulfilledAt, setFulfilledAt] = useState(detail.sale.fulfilled_at?.slice(0, 10) || todayDateInput());
  const [fulfillNotes, setFulfillNotes] = useState(detail.sale.fulfillment_notes || "");
  const [savingFulfillment, setSavingFulfillment] = useState(false);
  const [fulfillmentError, setFulfillmentError] = useState<string | null>(null);

  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>("cash_app");
  const [refundReason, setRefundReason] = useState("");
  const [refundAt, setRefundAt] = useState(todayDateInput());
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const remaining = Math.max(0, detail.sale.sale_price_cents - detail.totalPaidCents);

  function resetForm() {
    setEditingPaymentId(null);
    setAmount("");
    setMethod("cash_app");
    setType("deposit");
    setNote("");
    setPaidAt(todayDateInput());
    setError(null);
  }

  function handleStartEdit(payment: PaymentRow) {
    setOpenMenuId(null);
    setError(null);
    setEditingPaymentId(payment.id);
    setAmount((payment.amount_cents / 100).toString());
    setMethod(payment.payment_method);
    setType(payment.payment_type);
    setNote(payment.note || "");
    setPaidAt(payment.paid_at.slice(0, 10));
  }

  async function handleSubmit() {
    setError(null);
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }

    setSaving(true);
    const fields = {
      amountCents: Math.round(amountNum * 100),
      method,
      type,
      note,
      paidAt: new Date(paidAt).toISOString(),
    };
    const result = editingPaymentId
      ? await updatePayment(editingPaymentId, fields)
      : await logPayment(detail.sale.id, fields);
    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    resetForm();
    router.refresh();
  }

  async function handleDelete(payment: PaymentRow) {
    setOpenMenuId(null);
    const details = `${formatPriceFromCents(payment.amount_cents)} · ${PAYMENT_TYPE_LABEL[payment.payment_type]} · ${
      PAYMENT_METHOD_LABEL[payment.payment_method]
    } · ${formatDateOnly(payment.paid_at)}`;
    if (!confirm(`Delete this payment?\n\n${details}\n\nThis will be removed and financial totals will be recalculated.`)) {
      return;
    }
    const result = await deletePayment(payment.id);
    if (!result.success) {
      alert(result.error);
      return;
    }
    if (editingPaymentId === payment.id) resetForm();
    router.refresh();
  }

  async function handleCancel() {
    const reason = prompt("Reason for cancelling this sale?");
    if (reason === null) return;
    if (
      !confirm(
        "Cancel this sale? Payments already logged will stay on record. Any unpaid affiliate commission on it will be voided."
      )
    ) {
      return;
    }
    const result = await cancelSale(detail.sale.id, reason);
    if (!result.success) {
      alert(result.error);
      return;
    }
    router.push("/admin/sales");
  }

  async function handleSaveFulfillment() {
    setFulfillmentError(null);
    setSavingFulfillment(true);
    const result = await updateFulfillment(detail.sale.id, {
      method: fulfillMethod || null,
      status: fulfillStatus,
      scheduledFulfillmentAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      fulfilledAt: fulfillStatus === "completed" ? new Date(fulfilledAt).toISOString() : null,
      notes: fulfillNotes,
    });
    setSavingFulfillment(false);
    if (!result.success) {
      setFulfillmentError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleRefund() {
    setRefundError(null);
    const amountNum = parseFloat(refundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setRefundError("Enter a valid refund amount.");
      return;
    }
    if (!refundReason.trim()) {
      setRefundError("A reason is required.");
      return;
    }
    if (
      !confirm(
        `Refund ${formatPriceFromCents(Math.round(amountNum * 100))} and close this sale? This cannot be undone from here.`
      )
    ) {
      return;
    }

    setRefunding(true);
    const result = await refundSale(detail.sale.id, {
      amountCents: Math.round(amountNum * 100),
      method: refundMethod,
      reason: refundReason.trim(),
      refundedAt: new Date(refundAt).toISOString(),
    });
    setRefunding(false);

    if (!result.success) {
      setRefundError(result.error);
      return;
    }
    router.refresh();
    setShowRefundForm(false);
  }

  async function handleGenerateBillOfSale() {
    setError(null);
    setGenerating(true);
    const result = await generateBillOfSale(detail.sale.id);
    setGenerating(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(`/admin/documents/${result.documentId}`);
  }

  async function handleGenerateHealthGuarantee() {
    setError(null);
    setGenerating(true);
    const result = await generateHealthGuarantee(detail.sale.id);
    setGenerating(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(`/admin/documents/${result.documentId}`);
  }

  async function handleGenerateRefundPolicy() {
    setError(null);
    setGenerating(true);
    const result = await generateRefundPolicy(detail.sale.id);
    setGenerating(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(`/admin/documents/${result.documentId}`);
  }

  async function handleGeneratePuppyPurchaseAcknowledgement() {
    setError(null);
    setGenerating(true);
    const result = await generatePuppyPurchaseAcknowledgement(detail.sale.id);
    setGenerating(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(`/admin/documents/${result.documentId}`);
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="profile-card">
        <h2 className="admin-card__title">{detail.puppy.name}</h2>
        <p className="admin-hint" style={{ marginBottom: 10 }}>
          Buyer: <Link href={`/admin/contacts/${detail.contactId}`}>{detail.contactName}</Link>
        </p>
        <span className={`sale-progress-tag ${detail.progress}`}>{SALE_PROGRESS_LABEL[detail.progress]}</span>

        <div style={{ marginTop: 14 }}>
          <div className="profit-box-line">
            <span>Sale price</span>
            <span>{formatPriceFromCents(detail.sale.sale_price_cents)}</span>
          </div>
          <div className="profit-box-line">
            <span>Total paid</span>
            <span>{formatPriceFromCents(detail.totalPaidCents)}</span>
          </div>
          <div className="profit-box-total">
            <span>Remaining</span>
            <span>{formatPriceFromCents(remaining)}</span>
          </div>
        </div>

        {detail.sale.paid_in_full_at && (
          <p className="admin-hint" style={{ marginTop: 8 }}>
            Paid in full on {formatDateOnly(detail.sale.paid_in_full_at)}
          </p>
        )}

        {detail.sale.closed_at && (
          <p className="admin-hint" style={{ marginTop: 4 }}>
            {detail.sale.status === "refunded" ? "Refunded" : "Cancelled"} on {formatDateOnly(detail.sale.closed_at)}
            {detail.sale.closed_reason ? ` - ${detail.sale.closed_reason}` : ""}
          </p>
        )}
      </div>

      {detail.sale.affiliate_id && (
        <div className="profile-card">
          <h2 className="admin-card__title">Affiliate Attribution</h2>
          <div className="profit-box-line">
            <span>Referred by</span>
            <span>{detail.affiliateName || "Unknown affiliate"}</span>
          </div>
          {detail.commission && (
            <>
              <div className="profit-box-line">
                <span>Commission</span>
                <span>{formatPriceFromCents(detail.commission.amountCents)}</span>
              </div>
              <div className="profit-box-line">
                <span>Commission status</span>
                <span>{COMMISSION_STATUS_LABEL[detail.commission.status as keyof typeof COMMISSION_STATUS_LABEL]}</span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="profile-card">
        <h2 className="admin-card__title">Fulfillment</h2>
        <p className="admin-hint" style={{ marginBottom: 10 }}>
          When the customer actually receives the puppy - this date, not the sale date or a payment date, starts the
          affiliate commission hold period.
        </p>
        {fulfillmentError && <div className="inquire-error">{fulfillmentError}</div>}

        <div className="puppy-form-row">
          <div className="admin-field">
            <label className="admin-field__label">Method</label>
            <select
              className="admin-select"
              value={fulfillMethod}
              onChange={(e) => setFulfillMethod(e.target.value as FulfillmentMethod | "")}
            >
              <option value="">Not set</option>
              {FULFILLMENT_METHOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m === "pickup" ? "Pickup" : "Delivery"}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-field__label">Status</label>
            <select
              className="admin-select"
              value={fulfillStatus}
              onChange={(e) => setFulfillStatus(e.target.value as FulfillmentStatus)}
            >
              {FULFILLMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "pending" ? "Pending" : s === "scheduled" ? "Scheduled" : "Completed"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Scheduled date (optional)</label>
          <input className="admin-input" type="date" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </div>

        {fulfillStatus === "completed" && (
          <div className="admin-field">
            <label className="admin-field__label">Date customer actually received the puppy</label>
            <input className="admin-input" type="date" value={fulfilledAt} onChange={(e) => setFulfilledAt(e.target.value)} />
          </div>
        )}

        <div className="admin-field">
          <label className="admin-field__label">Notes (optional)</label>
          <input className="admin-input" value={fulfillNotes} onChange={(e) => setFulfillNotes(e.target.value)} />
        </div>

        <button type="button" className="admin-btn admin-btn--primary" onClick={handleSaveFulfillment} disabled={savingFulfillment}>
          {savingFulfillment ? "Saving..." : "Save Fulfillment"}
        </button>
      </div>

      <div className="profile-card">
        <h2 className="admin-card__title">{editingPaymentId ? "Edit Payment" : "Log a Payment"}</h2>
        {error && <div className="inquire-error">{error}</div>}

        <div className="admin-field">
          <label className="admin-field__label">Amount ($)</label>
          <input className="admin-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div className="puppy-form-row">
          <div className="admin-field">
            <label className="admin-field__label">Method</label>
            <select className="admin-select" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABEL[m]}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-field__label">Type</label>
            <select className="admin-select" value={type} onChange={(e) => setType(e.target.value as PaymentType)}>
              {PAYMENT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {PAYMENT_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Date</label>
          <input className="admin-input" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Note (optional)</label>
          <input className="admin-input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="admin-btn admin-btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : editingPaymentId ? "Save Changes" : "Log payment"}
          </button>
          {editingPaymentId && (
            <button type="button" className="admin-btn" onClick={resetForm} disabled={saving}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="profile-card">
        <h2 className="admin-card__title">Payment History</h2>
        {detail.payments.length === 0 ? (
          <p className="admin-hint">No payments logged yet.</p>
        ) : (
          detail.payments.map((p) => (
            <div key={p.id} className="payment-row">
              <div>
                <div className="payment-row-amount">{formatPriceFromCents(p.amount_cents)}</div>
                <div className="payment-row-meta">
                  {PAYMENT_TYPE_LABEL[p.payment_type]} · {PAYMENT_METHOD_LABEL[p.payment_method]}
                  {p.note ? ` · ${p.note}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="payment-row-meta">{formatDateOnly(p.paid_at)}</div>
                <div className="payment-row-actions">
                  <button
                    type="button"
                    className="payment-row-menu-btn"
                    onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                    aria-label="Payment actions"
                  >
                    •••
                  </button>
                  {openMenuId === p.id && (
                    <>
                      <div className="payment-row-menu-backdrop" onClick={() => setOpenMenuId(null)} />
                      <div className="payment-row-menu">
                        <button type="button" className="payment-row-menu-item" onClick={() => handleStartEdit(p)}>
                          Edit Payment
                        </button>
                        <button
                          type="button"
                          className="payment-row-menu-item payment-row-menu-item--danger"
                          onClick={() => handleDelete(p)}
                        >
                          Delete Payment
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="profile-card">
        <h2 className="admin-card__title">Documents</h2>
        {error && <div className="inquire-error" style={{ marginBottom: 10 }}>{error}</div>}
        {documents.length === 0 ? (
          <p className="admin-hint" style={{ marginBottom: 10 }}>
            No documents generated yet for this sale.
          </p>
        ) : (
          <div className="docview-generated-list" style={{ marginBottom: 10 }}>
            {documents.map((d) => (
              <div key={d.id} className="docview-generated-row">
                <div>
                  <div style={{ fontWeight: 700 }}>{d.templateName}</div>
                  <div className="admin-hint">{formatDateOnly(d.generatedAt)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className={`docview-status-badge ${d.status}`}>
                    {d.status === "finalized" ? "Finalized" : "Draft"}
                  </span>
                  <Link href={`/admin/documents/${d.id}`} className="admin-btn">
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="admin-btn admin-btn--primary" onClick={handleGenerateBillOfSale} disabled={generating}>
            {generating ? "Generating…" : "Generate Bill of Sale"}
          </button>
          <button type="button" className="admin-btn admin-btn--primary" onClick={handleGenerateHealthGuarantee} disabled={generating}>
            {generating ? "Generating…" : "Generate Health Guarantee"}
          </button>
          <button type="button" className="admin-btn admin-btn--primary" onClick={handleGenerateRefundPolicy} disabled={generating}>
            {generating ? "Generating…" : "Generate Refund Policy"}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={handleGeneratePuppyPurchaseAcknowledgement}
            disabled={generating}
          >
            {generating ? "Generating…" : "Generate Purchase Acknowledgement"}
          </button>
        </div>
      </div>

      {detail.sale.status === "active" && (
        <div className="profile-card profile-danger-zone">
          <h2 className="admin-card__title">Refund or Cancel</h2>

          {!showRefundForm ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" className="admin-btn admin-btn--danger" onClick={() => setShowRefundForm(true)}>
                Refund Sale
              </button>
              <button type="button" className="admin-btn" onClick={handleCancel}>
                Cancel this sale
              </button>
            </div>
          ) : (
            <div>
              {refundError && <div className="inquire-error">{refundError}</div>}
              <div className="admin-field">
                <label className="admin-field__label">Refund amount ($)</label>
                <input className="admin-input" type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
              </div>
              <div className="puppy-form-row">
                <div className="admin-field">
                  <label className="admin-field__label">Method</label>
                  <select className="admin-select" value={refundMethod} onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}>
                    {PAYMENT_METHOD_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {PAYMENT_METHOD_LABEL[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label className="admin-field__label">Date</label>
                  <input className="admin-input" type="date" value={refundAt} onChange={(e) => setRefundAt(e.target.value)} />
                </div>
              </div>
              <div className="admin-field">
                <label className="admin-field__label">Reason (required)</label>
                <input className="admin-input" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="admin-btn admin-btn--danger" onClick={handleRefund} disabled={refunding}>
                  {refunding ? "Refunding..." : "Confirm Refund"}
                </button>
                <button type="button" className="admin-btn" onClick={() => setShowRefundForm(false)} disabled={refunding}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
