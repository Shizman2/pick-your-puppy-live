"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateGeneratedDocumentContent } from "../../../app/admin/documents/actions";
import type { BillOfSaleResolvedData } from "../../../lib/documentTypes";

interface EditBillOfSaleFormProps {
  documentId: string;
  initialData: BillOfSaleResolvedData;
  onDone: () => void;
}

/**
 * "Edit This Copy" - every field here overrides the auto-resolved
 * value for THIS generated document only (saved into
 * generated_documents.edited_content). The master template and this
 * sale/contact/puppy's real records are never touched by anything on
 * this form.
 */
export default function EditBillOfSaleForm({ documentId, initialData, onDone }: EditBillOfSaleFormProps) {
  const router = useRouter();
  const [data, setData] = useState<BillOfSaleResolvedData>(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function field(key: keyof BillOfSaleResolvedData) {
    return {
      value: data[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setData((prev) => ({ ...prev, [key]: e.target.value })),
    };
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    const result = await updateGeneratedDocumentContent(documentId, data);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
    onDone();
  }

  return (
    <div className="profile-card" style={{ maxWidth: 720 }}>
      {error && <div className="inquire-error">{error}</div>}

      <h3 className="admin-card__title">Seller Information</h3>
      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Seller</label>
          <input className="admin-input" {...field("business_name")} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Website</label>
          <input className="admin-input" {...field("business_website")} />
        </div>
      </div>
      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Phone</label>
          <input className="admin-input" {...field("business_phone")} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Email</label>
          <input className="admin-input" {...field("business_email")} />
        </div>
      </div>

      <h3 className="admin-card__title">Buyer Information</h3>
      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Buyer Name</label>
          <input className="admin-input" {...field("buyer_name")} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Phone Number</label>
          <input className="admin-input" {...field("buyer_phone")} />
        </div>
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Address</label>
        <input className="admin-input" {...field("buyer_address")} />
      </div>
      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">City</label>
          <input className="admin-input" {...field("buyer_city")} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">State</label>
          <input className="admin-input" {...field("buyer_state")} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Zip</label>
          <input className="admin-input" {...field("buyer_zip")} />
        </div>
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Email</label>
        <input className="admin-input" {...field("buyer_email")} />
      </div>

      <h3 className="admin-card__title">Puppy Information</h3>
      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Puppy Name</label>
          <input className="admin-input" {...field("puppy_name")} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Breed</label>
          <input className="admin-input" {...field("puppy_breed")} />
        </div>
      </div>
      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Sex</label>
          <input className="admin-input" {...field("puppy_sex")} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Date of Birth</label>
          <input className="admin-input" {...field("puppy_dob")} />
        </div>
      </div>
      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Color / Markings</label>
          <input className="admin-input" {...field("puppy_color")} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Registration</label>
          <input className="admin-input" {...field("puppy_registration")} />
        </div>
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Microchip #</label>
        <input className="admin-input" {...field("puppy_microchip")} />
      </div>

      <h3 className="admin-card__title">Purchase Information</h3>
      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Date of Sale</label>
          <input className="admin-input" {...field("sale_date")} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Total Purchase Price</label>
          <input className="admin-input" {...field("sale_price")} />
        </div>
      </div>
      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Reservation Payment</label>
          <input className="admin-input" {...field("reservation_amount")} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Date Received</label>
          <input className="admin-input" {...field("reservation_date")} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Method</label>
          <input className="admin-input" {...field("reservation_method")} />
        </div>
      </div>
      <div className="puppy-form-row">
        <div className="admin-field">
          <label className="admin-field__label">Remaining Balance Paid</label>
          <input className="admin-input" {...field("balance_amount")} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Date Paid</label>
          <input className="admin-input" {...field("balance_date")} />
        </div>
        <div className="admin-field">
          <label className="admin-field__label">Method</label>
          <input className="admin-input" {...field("balance_method")} />
        </div>
      </div>

      <h3 className="admin-card__title">Vaccination Record</h3>
      <div className="admin-field">
        <label className="admin-field__label">Age-appropriate vaccinations complete</label>
        <select
          className="admin-select"
          value={data.vaccination_complete}
          onChange={(e) =>
            setData((prev) => ({ ...prev, vaccination_complete: e.target.value as "yes" | "no" | "" }))
          }
        >
          <option value="">Not set</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save This Copy"}
        </button>
        <button type="button" className="admin-btn" onClick={onDone} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
}
