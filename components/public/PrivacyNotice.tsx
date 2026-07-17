interface PrivacyNoticeProps {
  message: string;
}

export default function PrivacyNotice({ message }: PrivacyNoticeProps) {
  return (
    <div className="privacy-notice">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
