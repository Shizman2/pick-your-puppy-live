export interface MetricCardProps {
  icon: React.ReactNode;
  colorKey: "blue" | "green" | "amber" | "purple" | "red";
  value: number;
  label: string;
  /** Pre-formatted, e.g. "24%" - null means "no meaningful comparison" (previous period had zero activity), and is omitted entirely rather than shown as a misleading number. */
  changePercent: number | null;
  compareLabel: string;
}

/** One of the 5 top metric cards. Purely presentational - all comparison-math and rounding happens server-side in app/admin/analytics/page.tsx. */
export default function MetricCard({ icon, colorKey, value, label, changePercent, compareLabel }: MetricCardProps) {
  return (
    <div className={`analytics-metric-card analytics-metric-card--${colorKey}`}>
      <div className={`analytics-metric-icon analytics-metric-icon--${colorKey}`}>{icon}</div>
      <div className="analytics-metric-value">{value.toLocaleString()}</div>
      <div className="analytics-metric-label">{label}</div>
      {changePercent !== null ? (
        <div className={`analytics-metric-change ${changePercent >= 0 ? "up" : "down"}`}>
          {changePercent >= 0 ? "↑" : "↓"} {Math.abs(Math.round(changePercent))}%
        </div>
      ) : null}
      <div className="analytics-metric-sub">{compareLabel}</div>
    </div>
  );
}
