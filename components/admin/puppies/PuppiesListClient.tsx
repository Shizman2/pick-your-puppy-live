import Link from "next/link";
import type { PuppyRow } from "../../../lib/puppyTypes";
import { formatPriceFromCents } from "../../../lib/puppyTypes";

export default function PuppiesListClient({ puppies }: { puppies: PuppyRow[] }) {
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
          </div>
          <div className="puppy-admin-card-body">
            <div className="puppy-admin-card-name">{p.name}</div>
            <div className="puppy-admin-card-meta">{p.breed}</div>
            <div className="puppy-admin-card-price">{formatPriceFromCents(p.price_cents)}</div>
            <div className={`puppy-status-pill ${p.status}`}>{p.status}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
