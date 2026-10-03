import type { LandingPageItem } from "../../../lib/analytics/queries";
import { friendlyPageLabel } from "../../../lib/analytics/queries";

/**
 * Entry-page-of-session breakdown - deliberately NOT the same data as
 * Top Pages (which counts every page_view, including repeat views and
 * internal navigation back to a page). This is specifically "where did
 * sessions actually begin," which is what matters for judging where
 * paid traffic is landing.
 */
export default function LandingPagesCard({ pages }: { pages: LandingPageItem[] }) {
  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="analytics-card-title">Landing Pages</div>
      </div>

      {pages.length === 0 ? (
        <p className="analytics-empty">No sessions recorded yet for this period.</p>
      ) : (
        <div className="analytics-table-list">
          {pages.map((p) => (
            <div key={p.path} className="analytics-table-row">
              <div className="analytics-table-label">
                {friendlyPageLabel(p.path)}
                {friendlyPageLabel(p.path) !== p.path && <span className="analytics-table-label-sub">{p.path}</span>}
              </div>
              <div className="analytics-table-metric">
                <div className="analytics-table-metric-value">{p.sessions}</div>
                <div className="analytics-table-metric-label">Sessions</div>
              </div>
              <div className="analytics-table-metric">
                <div className="analytics-table-metric-value">{p.visitors}</div>
                <div className="analytics-table-metric-label">Visitors</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
