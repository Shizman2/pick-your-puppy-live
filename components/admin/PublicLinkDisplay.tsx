"use client";

import { useEffect, useState } from "react";

interface PublicLinkDisplayProps {
  slug: string;
}

export default function PublicLinkDisplay({ slug }: PublicLinkDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  // window is only available client-side, so this fills in after mount
  // rather than during server rendering (avoids a hydration mismatch).
  useEffect(() => {
    setUrl(`${window.location.origin}/show/${slug}`);
  }, [slug]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (e.g. no HTTPS, permissions) - the
      // field itself is still selectable/copyable by hand as a fallback.
    }
  }

  return (
    <div className="admin-field">
      <label className="admin-field__label">Private attendee link</label>
      <div className="admin-field__row">
        <input className="admin-input" type="text" value={url} readOnly />
        <button
          type="button"
          className="admin-btn"
          onClick={handleCopy}
          style={{ flexShrink: 0 }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="admin-hint">
        This is the actual link to send to registered attendees. It&apos;s
        long and hard to guess, but not true authentication - anyone who has
        it can open it or forward it.
      </p>
    </div>
  );
}
