"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { startSale } from "../../../app/admin/sales/actions";
import type { PuppyRow } from "../../../lib/puppyTypes";
import { formatPriceFromCents } from "../../../lib/puppyTypes";

interface ContactOption {
  id: string;
  first_name: string;
  last_name: string | null;
  display_name: string | null;
}

export default function StartSaleForm({ puppy, contacts }: { puppy: PuppyRow; contacts: ContactOption[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [salePrice, setSalePrice] = useState((puppy.price_cents / 100).toString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts.slice(0, 20);
    return contacts
      .filter((c) => {
        const name = c.display_name || `${c.first_name} ${c.last_name || ""}`;
        return name.toLowerCase().includes(q);
      })
      .slice(0, 20);
  }, [query, contacts]);

  async function handleStart() {
    setError(null);
    if (!selectedId) {
      setError("Please select a buyer from Contacts.");
      return;
    }
    const priceNum = parseFloat(salePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Enter a valid sale price.");
      return;
    }

    setSaving(true);
    const result = await startSale(puppy.id, selectedId, Math.round(priceNum * 100));
    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/admin/sales/${result.saleId}`);
  }

  return (
    <div className="profile-card" style={{ maxWidth: 480 }}>
      {error && <div className="inquire-error">{error}</div>}

      <div className="admin-field">
        <label className="admin-field__label">Puppy</label>
        <input className="admin-input" value={puppy.name} readOnly />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Sale price ($)</label>
        <input
          className="admin-input"
          type="number"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
        />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Buyer - search Contacts</label>
        <input
          className="admin-input"
          placeholder="Type a name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="contact-picker-list">
          {filtered.length === 0 ? (
            <div className="contact-picker-item">No matches</div>
          ) : (
            filtered.map((c) => {
              const name = c.display_name || `${c.first_name} ${c.last_name || ""}`.trim();
              return (
                <div
                  key={c.id}
                  className={`contact-picker-item${selectedId === c.id ? " selected" : ""}`}
                  onClick={() => setSelectedId(c.id)}
                >
                  {name}
                </div>
              );
            })
          )}
        </div>
      </div>

      <button type="button" className="admin-btn admin-btn--primary" onClick={handleStart} disabled={saving} style={{ marginTop: 12 }}>
        {saving ? "Starting..." : `Start sale for ${formatPriceFromCents(Math.round((parseFloat(salePrice) || 0) * 100))}`}
      </button>
    </div>
  );
}
