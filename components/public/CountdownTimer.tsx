interface CountdownTimerProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

/**
 * Phase 2: pure display component driven by fake props.
 * Phase 3 will feed this real, server-verified time-remaining values.
 */
export default function CountdownTimer({
  days,
  hours,
  minutes,
  seconds,
}: CountdownTimerProps) {
  const units = [
    { value: days, label: "Days" },
    { value: hours, label: "Hrs" },
    { value: minutes, label: "Mins" },
    { value: seconds, label: "Secs" },
  ];

  return (
    <div className="countdown-row">
      {units.map((unit) => (
        <div className="countdown-unit" key={unit.label}>
          <div className="countdown-unit__value">{pad(unit.value)}</div>
          <div className="countdown-unit__label">{unit.label}</div>
        </div>
      ))}
    </div>
  );
}
