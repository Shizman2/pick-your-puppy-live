import type { CampaignItem } from "../../../lib/analytics/queries";

/**
 * Raw utm_campaign/utm_source/utm_medium, exactly as captured - rows
 * only ever appear for sessions that actually carried a utm_campaign
 * value (see getCampaigns), so this never shows a meaningless blank
 * "campaign" for ordinary organic traffic.
 */
export default function CampaignsCard({ campaigns }: { campaigns: CampaignItem[] }) {
  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="analytics-card-title">Campaigns</div>
      </div>

      {campaigns.length === 0 ? (
        <p className="analytics-empty">No UTM-tagged campaign traffic recorded yet for this period.</p>
      ) : (
        <div className="analytics-table-list">
          {campaigns.map((c, i) => (
            <div key={`${c.campaign}-${c.source}-${c.medium}-${i}`} className="analytics-table-row">
              <div className="analytics-table-label">
                {c.campaign}
                <span className="analytics-table-label-sub">
                  {c.source || "unknown source"}
                  {c.medium ? ` · ${c.medium}` : ""}
                </span>
              </div>
              <div className="analytics-table-metric">
                <div className="analytics-table-metric-value">{c.sessions}</div>
                <div className="analytics-table-metric-label">Sessions</div>
              </div>
              <div className="analytics-table-metric">
                <div className="analytics-table-metric-value">{c.visitors}</div>
                <div className="analytics-table-metric-label">Visitors</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
