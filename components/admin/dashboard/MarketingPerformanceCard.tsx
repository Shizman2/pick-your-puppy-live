import { Fragment } from "react";
import Link from "next/link";
import type { MarketingPerformance } from "../../../lib/businessScorecard";
import { formatPriceFromCents } from "../../../lib/puppyTypes";

/** Profit After Ads can be negative (ad spend exceeding Gross Profit) - formatPriceFromCents alone renders that as "$-500" instead of "-$500". */
function formatSignedPriceFromCents(cents: number): string {
  return cents < 0 ? `-${formatPriceFromCents(-cents)}` : formatPriceFromCents(cents);
}

const FUNNEL_STEPS: { key: keyof MarketingPerformance["funnel"]; label: string }[] = [
  { key: "landingVisitors", label: "Landing Visitors" },
  { key: "puppyViewers", label: "Puppy Viewers" },
  { key: "leads", label: "Leads" },
  { key: "sales", label: "Sales" },
];

/**
 * A marketing-ROI view of the same period as the top metric row - ends in
 * "Sales" rather than "Inquiries" (unlike the Analytics page's own funnel,
 * see FunnelCard.tsx), since Cost Per Sale/ROAS below need an actual sale
 * count, not inquiry volume.
 */
export default function MarketingPerformanceCard({ data }: { data: MarketingPerformance }) {
  return (
    <div className="dash2-section">
      <div className="dash2-section-header">
        <div className="dash2-section-title">Marketing Performance</div>
        <Link href="/admin/analytics" className="dash2-section-link">
          View Full Analytics →
        </Link>
      </div>

      <div className="dash2-mp-funnel">
        {FUNNEL_STEPS.map((step, i) => (
          <Fragment key={step.key}>
            <div className="dash2-mp-funnel-step">
              <div className="dash2-mp-funnel-value">{data.funnel[step.key].toLocaleString()}</div>
              <div className="dash2-mp-funnel-label">{step.label}</div>
            </div>
            {i < FUNNEL_STEPS.length - 1 && <div className="dash2-mp-funnel-arrow">→</div>}
          </Fragment>
        ))}
      </div>

      <div className="dash2-mp-stats">
        <div>
          <div className="dash2-goal-grid-label">Cost Per Lead</div>
          <div className="dash2-goal-grid-value">
            {data.costPerLeadCents !== null ? formatPriceFromCents(data.costPerLeadCents) : "—"}
          </div>
        </div>
        <div>
          <div className="dash2-goal-grid-label">Cost Per Sale</div>
          <div className="dash2-goal-grid-value">
            {data.costPerSaleCents !== null ? formatPriceFromCents(data.costPerSaleCents) : "—"}
          </div>
        </div>
        <div>
          <div className="dash2-goal-grid-label">ROAS</div>
          <div className="dash2-goal-grid-value">{data.roas !== null ? `${data.roas.toFixed(1)}x` : "—"}</div>
        </div>
        <div>
          <div className="dash2-goal-grid-label">Lead → Sale Rate</div>
          <div className="dash2-goal-grid-value">
            {data.leadToSaleRate !== null ? `${Math.round(data.leadToSaleRate)}%` : "—"}
          </div>
        </div>
        <div>
          <div className="dash2-goal-grid-label">Profit After Ads</div>
          <div className="dash2-goal-grid-value">{formatSignedPriceFromCents(data.profitAfterAdsCents)}</div>
        </div>
      </div>
    </div>
  );
}
