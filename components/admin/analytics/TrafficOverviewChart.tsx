import type { TrafficOverviewPoint } from "../../../lib/analytics/queries";

// Hand-rolled inline-SVG chart, matching this project's existing
// convention (see components/admin/dashboard/PuppyStatusDonut.tsx) -
// deliberately no charting library dependency added for this.

const WIDTH = 700;
const HEIGHT = 260;
const PAD_LEFT = 34;
const PAD_RIGHT = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

function computeNiceMax(value: number): number {
  if (value <= 5) return 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  let niceNormalized: number;
  if (normalized <= 1) niceNormalized = 1;
  else if (normalized <= 2) niceNormalized = 2;
  else if (normalized <= 5) niceNormalized = 5;
  else niceNormalized = 10;
  return niceNormalized * magnitude;
}

export default function TrafficOverviewChart({ points }: { points: TrafficOverviewPoint[] }) {
  const innerWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const maxValue = Math.max(1, ...points.map((p) => Math.max(p.visitors, p.pageViews)));
  const niceMax = computeNiceMax(maxValue);
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;

  const x = (i: number) => PAD_LEFT + stepX * i;
  const y = (value: number) => PAD_TOP + innerHeight - (value / niceMax) * innerHeight;

  const linePath = (key: "visitors" | "pageViews") =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p[key])}`).join(" ");

  const areaPath = (key: "visitors" | "pageViews") => {
    if (points.length === 0) return "";
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p[key])}`).join(" ");
    return `${line} L ${x(points.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;
  };

  const yTicks = [0, niceMax * 0.33, niceMax * 0.66, niceMax];
  const showEvery = Math.max(1, Math.ceil(points.length / 8));

  return (
    <div className="analytics-chart-wrap">
      <div className="analytics-chart-legend">
        <span className="analytics-legend-item">
          <span className="analytics-legend-dot analytics-legend-dot--visitors" /> Visitors
        </span>
        <span className="analytics-legend-item">
          <span className="analytics-legend-dot analytics-legend-dot--pageviews" /> Page Views
        </span>
      </div>
      {points.length === 0 ? (
        <p className="analytics-empty">No traffic recorded yet for this period.</p>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="analytics-chart-svg" preserveAspectRatio="none">
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y(t)} y2={y(t)} stroke="#f1f1f1" strokeWidth="1" />
              <text x={PAD_LEFT - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#9ca3af">
                {Math.round(t)}
              </text>
            </g>
          ))}

          <path d={areaPath("pageViews")} fill="#DBEAFE" opacity="0.6" />
          <path d={linePath("pageViews")} fill="none" stroke="#93C5FD" strokeWidth="2.5" />
          <path d={linePath("visitors")} fill="none" stroke="#2563EB" strokeWidth="2.5" />

          {points.map((p, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(p.pageViews)} r="3.5" fill="#93C5FD" />
              <circle cx={x(i)} cy={y(p.visitors)} r="3.5" fill="#2563EB" />
            </g>
          ))}

          {points.map((p, i) => {
            if (i % showEvery !== 0 && i !== points.length - 1) return null;
            return (
              <text key={i} x={x(i)} y={HEIGHT - 6} textAnchor="middle" fontSize="11" fill="#9ca3af">
                {p.label}
              </text>
            );
          })}
        </svg>
      )}
    </div>
  );
}
