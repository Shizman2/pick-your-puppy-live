"use client";

import { useState } from "react";
import type { VisitorFavoriteItem } from "../../../lib/favorites";
import { toggleFavorite } from "../favoriteActions";
import { formatPriceFromCents } from "../../../lib/puppyTypes";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  available: { label: "Available", color: "#16A34A" },
  hold: { label: "Pending Adoption", color: "#D97706" },
  sold: { label: "Sold", color: "#6B7280" },
  on_sale: { label: "On Sale", color: "#EA580C" },
  discounted: { label: "On Sale", color: "#EA580C" },
};

function RemoveHeart({ puppyId, onRemoved }: { puppyId: string; onRemoved: () => void }) {
  const [pending, setPending] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    const result = await toggleFavorite(puppyId);
    setPending(false);
    // Whether it un-favorited (the common case) or the toggle otherwise
    // landed on "not favorited," either way this puppy no longer
    // belongs on a page whose entire point is "still favorited."
    if (result.success && !result.isFavorited) {
      onRemoved();
    }
  }

  return (
    <button type="button" className="favorite-btn is-favorited" onClick={handleClick} disabled={pending} aria-label="Remove from favorites">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21z" />
      </svg>
    </button>
  );
}

export default function FavoritesGrid({ favorites }: { favorites: VisitorFavoriteItem[] }) {
  const [items, setItems] = useState(favorites);

  function handleRemoved(id: string) {
    setItems((prev) => prev.filter((f) => f.id !== id));
  }

  if (items.length === 0) {
    return (
      <div className="no-results">
        You haven&apos;t favorited any puppies yet. Browse <a href="/puppies">available puppies</a> and tap the heart
        to save your favorites!
      </div>
    );
  }

  return (
    <div className="puppy-grid">
      {items.map((f) => {
        const p = f.puppy;
        const badge = STATUS_BADGE[p.status] || STATUS_BADGE.available;
        return (
          <div key={f.id} className="pcard">
            <a className="pcard-link" href={`/puppies/${p.slug}`}>
              <div className="pcard-img-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photoUrl} alt={p.breed} />
              </div>
              <div className="pcard-body">
                <div className="pcard-top-row">
                  <span className="pcard-status-badge" style={{ background: badge.color }}>
                    {badge.label}
                  </span>
                </div>
                <div className="pcard-name">{p.name || p.breed}</div>
                <div className="pcard-breed">{p.breed}</div>
                <div className="pcard-meta">
                  <span>{p.gender === "male" ? "Male" : "Female"}</span>
                </div>
                <div className="pcard-footer">
                  <span className="pcard-price">{formatPriceFromCents(p.salePriceCents ?? p.priceCents)}</span>
                  <span className="pcard-btn">View ›</span>
                </div>
              </div>
            </a>
            <div className="pcard-heart-overlay">
              <RemoveHeart puppyId={p.id} onRemoved={() => handleRemoved(f.id)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
