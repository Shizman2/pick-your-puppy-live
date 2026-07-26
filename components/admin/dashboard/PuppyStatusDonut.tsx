import type { PuppyStatusBreakdown } from "../../../lib/dashboard";

export default function PuppyStatusDonut({ data }: { data: PuppyStatusBreakdown }) {
  const { total, available, hold, sold } = data;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { label: "Available", value: available, color: "#22c55e" },
    { label: "Reserved (Hold)", value: hold, color: "#f59e0b" },
    { label: "Sold", value: sold, color: "#8B6BFF" },
  ];

  let offsetSoFar = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f1f1" strokeWidth="14" />
          {total > 0 &&
            segments.map((seg) => {
              const fraction = seg.value / total;
              const dash = fraction * circumference;
              const el = (
                <circle
                  key={seg.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 22, color: "#111827" }}>{total}</div>
          <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700 }}>TOTAL</div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {segments.map((seg) => (
          <div key={seg.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontSize: 13 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color, display: "inline-block" }} />
              {seg.label}
            </span>
            <span style={{ fontWeight: 700 }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
