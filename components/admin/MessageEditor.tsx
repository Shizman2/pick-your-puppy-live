interface MessageEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}

export default function MessageEditor({ label, value, onChange, multiline }: MessageEditorProps) {
  return (
    <div className="admin-field">
      <label className="admin-field__label">{label}</label>
      {multiline ? (
        <textarea
          className="admin-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="admin-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
