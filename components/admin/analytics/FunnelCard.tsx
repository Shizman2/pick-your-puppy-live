import type { FunnelData } from "../../../lib/analytics/queries";

const STEPS: { key: keyof FunnelData; label: string }[] = [
  { key: "landingVisitors", label: "Landing Visitors" },
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
