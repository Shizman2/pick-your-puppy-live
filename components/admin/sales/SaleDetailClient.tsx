"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logPayment, cancelSale } from "../../../app/admin/sales/actions";
import type { SaleDetail } from "../../../lib/sales";
import { formatPriceFromCents } from "../../../lib/puppyTypes";
import {
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_LABEL,
  PAYMENT_TYPE_OPTIONS,
  PAYMENT_TYPE_LABEL,
  SALE_PROGRESS_LABEL,
  type PaymentMethod,
  type PaymentType,
} from "../../../lib/saleTypes";

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function SaleDetailClient({ detail }: { detail: SaleDetail }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash_app");
  const [type, setType] = useState<PaymentType>("deposit");
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState(todayDateInput());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(0, detail.sale.sale_price_cents - detail.totalPaidCents);

  async function handleLogPayment() {
    setError(null);
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }

    setSaving(true);
    const result = await logPayment(detail.sale.id, {
      amountCents: Math.round(amountNum * 100),
      method,
      type,
      note,
      paidAt: new Date(paidAt).toISOString(),
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setAmount("");
    setNote("");
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
        <h2 className="admin-card__title">Log a Payment</h2>
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

        <button type="button" className="admin-btn admin-btn--primary" onClick={handleLogPayment} disabled={saving}>
          {saving ? "Saving..." : "Log payment"}
        </button>
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
              <div className="payment-row-meta">{new Date(p.paid_at).toLocaleDateString()}</div>
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
