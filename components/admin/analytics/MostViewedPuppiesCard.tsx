import type { MostViewedPuppy } from "../../../lib/analytics/queries";

export default function MostViewedPuppiesCard({ puppies }: { puppies: MostViewedPuppy[] }) {
  const maxViews = Math.max(1, ...puppies.map((p) => p.views));

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="analytics-card-title">Most Viewed Puppies</div>
      </div>

      {puppies.length === 0 ? (
        <p className="analytics-empty">No puppy views recorded yet for this period.</p>
      ) : (
        <div className="analytics-puppy-list">
          {puppies.map((p, i) => (
            <div key={p.puppyId} className="analytics-puppy-row">
              <span className="analytics-puppy-rank">{i + 1}</span>
              {p.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photoUrl} alt={p.name} className="analytics-puppy-photo" />
              ) : (
                <div className="analytics-puppy-photo analytics-puppy-photo--placeholder">🐾</div>
              )}
              <div className="analytics-puppy-info">
                <div className="analytics-puppy-name">{p.name}</div>
                <div className="analytics-puppy-views">{p.views} views</div>
                <div className="analytics-bar-track">
                  <div className="analytics-bar-fill" style={{ width: `${(p.views / maxViews) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
