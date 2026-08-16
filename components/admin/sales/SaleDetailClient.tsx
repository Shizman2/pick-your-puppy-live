"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logPayment, updatePayment, deletePayment, cancelSale } from "../../../app/admin/sales/actions";
import type { SaleDetail } from "../../../lib/sales";
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

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function SaleDetailClient({ detail }: { detail: SaleDetail }) {
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
    if (!confirm("Cancel this sale? Payments already logged will stay on record.")) return;
    await cancelSale(detail.sale.id);
    router.push("/admin/sales");
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

      {detail.sale.status === "active" && (
        <button type="button" className="admin-btn admin-btn--danger" onClick={handleCancel}>
          Cancel this sale
        </button>
      )}
    </div>
  );
}
