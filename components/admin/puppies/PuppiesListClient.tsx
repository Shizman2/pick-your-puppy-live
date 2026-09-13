import Link from "next/link";
import type { PuppyRow } from "../../../lib/puppyTypes";
import { formatPriceFromCents, STATUS_DISPLAY_LABEL } from "../../../lib/puppyTypes";

export default function PuppiesListClient({
  puppies,
  favoritesCounts = {},
}: {
  puppies: PuppyRow[];
  favoritesCounts?: Record<string, number>;
}) {
  if (puppies.length === 0) {
    return <div className="contacts-empty">No puppies yet. Click &quot;+ Add Puppy&quot; to add one.</div>;
  }

  return (
    <div className="puppies-grid">
      {puppies.map((p) => (
        <Link key={p.id} href={`/admin/puppies/${p.id}`} className="puppy-admin-card">
          <div className="puppy-admin-card-photo">
            {p.photo_urls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photo_urls[0]} alt={p.name} />
            ) : (
              "No photo"
            )}
            {favoritesCounts[p.id] > 0 && (
              <span className="puppy-admin-card-favorites" title="Total favorites">
                ♥ {favoritesCounts[p.id]}
              </span>
            )}
          </div>
          <div className="puppy-admin-card-body">
            <div className="puppy-admin-card-name">{p.name}</div>
            <div className="puppy-admin-card-meta">{p.breed}</div>
            <div className="puppy-admin-card-price">{formatPriceFromCents(p.price_cents)}</div>
            <div className={`puppy-status-pill ${p.status}`}>{STATUS_DISPLAY_LABEL[p.status]}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
