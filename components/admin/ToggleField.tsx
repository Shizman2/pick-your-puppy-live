interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export default function ToggleField({ label, checked, onChange }: ToggleFieldProps) {
  return (
    <div className="admin-toggle-row">
      <span className="admin-toggle-label">{label}</span>
      <button
        type="button"
        className={`admin-toggle${checked ? " on" : ""}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      />
    </div>
  );
}
