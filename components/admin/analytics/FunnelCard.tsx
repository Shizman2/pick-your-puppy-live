import type { FunnelData } from "../../../lib/analytics/queries";

// The first step's label is deliberately "Website Sessions", NOT
// "Landing Visitors" - this step counts any distinct analytics_sessions
// visitor_id on thepuppyplugs.com (see getFunnelData/getFunnelDataForRange),
// which is a different, broader thing than actual unique visitors to the
// GHL /start landing page (pickyourpuppylive.com). "Landing Visitors" is
// now a real, separately-tracked metric - see the Business Dashboard's
// Marketing Performance card (lib/businessScorecard.ts) and the Pre-Launch
// Tracking Fix. Reusing that same label here for a different number would
// be exactly the misleading collision that fix was about.
const STEPS: { key: keyof FunnelData; label: string }[] = [
  { key: "landingVisitors", label: "Website Sessions" },
  { key: "puppyViewers", label: "Puppy Viewers" },
  { key: "leads", label: "Leads" },
  { key: "inquiries", label: "Inquiries" },
];

/**
 * A simple per-stage count for the selected period, not a cohort trace
 * of the same visitors through every step - see getFunnelData() for
 * exactly what is and isn't possible today.
 */
export default function FunnelCard({ data }: { data: FunnelData }) {
  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="analytics-card-title">Funnel</div>
      </div>

      <div className="analytics-funnel">
        {STEPS.map((step, i) => (
          <div key={step.key}>
            <div className="analytics-funnel-step">
              <span className="analytics-funnel-label">{step.label}</span>
              <span className="analytics-funnel-value">{data[step.key].toLocaleString()}</span>
            </div>
            {i < STEPS.length - 1 && <div className="analytics-funnel-arrow">↓</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
