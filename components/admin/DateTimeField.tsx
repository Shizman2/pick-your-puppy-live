interface DateTimeFieldProps {
  label: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}

export default function DateTimeField({
  label,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
}: DateTimeFieldProps) {
  return (
    <div className="admin-field">
      <label className="admin-field__label">{label}</label>
      <div className="admin-field__row">
        <input
          className="admin-input"
          type="date"
          value={dateValue}
          onChange={(e) => onDateChange(e.target.value)}
        />
        <input
          className="admin-input"
          type="time"
          value={timeValue}
          onChange={(e) => onTimeChange(e.target.value)}
        />
      </div>
    </div>
  );
}
