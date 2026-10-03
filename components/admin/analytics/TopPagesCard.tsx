import type { TopPageItem } from "../../../lib/analytics/queries";
import { friendlyPageLabel } from "../../../lib/analytics/queries";

export default function TopPagesCard({ pages }: { pages: TopPageItem[] }) {
  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="analytics-card-title">Top Pages</div>
      </div>

      {pages.length === 0 ? (
        <p className="analytics-empty">No page views recorded yet for this period.</p>
      ) : (
        <div className="analytics-table-list">
          {pages.map((p) => (
            <div key={p.path} className="analytics-table-row">
              <div className="analytics-table-label">
                {friendlyPageLabel(p.path)}
                {friendlyPageLabel(p.path) !== p.path && <span className="analytics-table-label-sub">{p.path}</span>}
              </div>
              <div className="analytics-table-metric">
                <div className="analytics-table-metric-value">{p.views}</div>
                <div className="analytics-table-metric-label">Views</div>
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
