interface LiveLinkFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export default function LiveLinkField({ value, onChange }: LiveLinkFieldProps) {
  return (
    <div className="admin-field">
      <label className="admin-field__label">Live show link</label>
      <input
        className="admin-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="admin-hint">
        Hidden from visitors. Used for the Enter Live Show button once the
        countdown ends.
      </p>
    </div>
  );
}
