interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
}

// A short, deliberately limited list rather than all ~400 IANA zones -
// easy to extend later, but this covers continental US time zones,
// which is what this project needs right now.
const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (America/New_York)" },
  { value: "America/Chicago", label: "Central Time (America/Chicago)" },
  { value: "America/Denver", label: "Mountain Time (America/Denver)" },
  { value: "America/Los_Angeles", label: "Pacific Time (America/Los_Angeles)" },
];

export default function TimezoneSelect({ value, onChange }: TimezoneSelectProps) {
  return (
    <div className="admin-field">
      <label className="admin-field__label">Time zone</label>
      <select
        className="admin-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {TIMEZONE_OPTIONS.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>
    </div>
  );
}
