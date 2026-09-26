import type { TrafficSourceBreakdown } from "../../../lib/analytics/queries";

// Same hand-rolled-donut technique as PuppyStatusDonut.tsx, adapted to
// the 4 traffic-source categories and a centered "N Visitors" label.

const SOURCE_LABEL: Record<string, string> = {
  facebook_instagram: "Facebook / Instagram",
  direct: "Direct",
  google: "Google",
  referral_other: "Referral / Other",
};

const SOURCE_COLOR: Record<string, string> = {
  facebook_instagram: "#3B82F6",
  direct: "#EC4899",
  google: "#10B981",
  referral_other: "#F59E0B",
};

export default function TrafficSourcesDonut({
  total,
  breakdown,
}: {
  total: number;
  breakdown: TrafficSourceBreakdown[];
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offsetSoFar = 0;

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="analytics-card-title">Traffic Sources</div>
      </div>

      {total === 0 ? (
        <p className="analytics-empty">No visitors recorded yet for this period.</p>
      ) : (
        <>
          <div className="analytics-donut-svg-wrap">
            <svg width="210" height="210" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f1f1" strokeWidth="14" />
              {breakdown
                .filter((b) => b.count > 0)
                .map((b) => {
                  const fraction = b.count / total;
                  const dash = fraction * circumference;
                  const el = (
                    <circle
                      key={b.source}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke={SOURCE_COLOR[b.source]}
                      strokeWidth="14"
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={-offsetSoFar}
                      transform="rotate(-90 50 50)"
                    />
                  );
                  offsetSoFar += dash;
                  return el;
                })}
            </svg>
            <div className="analytics-donut-center">
              <div className="analytics-donut-center-value">{total}</div>
              <div className="analytics-donut-center-label">Visitors</div>
            </div>
          </div>

          <div className="analytics-source-list">
            {breakdown.map((b) => (
              <div key={b.source} className="analytics-source-row">
                <span className="analytics-source-name">
                  <span className="analytics-source-dot" style={{ background: SOURCE_COLOR[b.source] }} />
                  {SOURCE_LABEL[b.source]}
                </span>
                <span className="analytics-source-percent">{b.percent}%</span>
                <span className="analytics-source-count">{b.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
