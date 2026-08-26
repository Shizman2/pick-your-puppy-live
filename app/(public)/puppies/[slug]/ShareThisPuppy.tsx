"use client";

import { useState } from "react";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export default function ShareThisPuppy({ puppyName, slug }: { puppyName: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  function getUrl(): string {
    if (typeof window === "undefined") return `/puppies/${slug}`;
    return `${window.location.origin}/puppies/${slug}`;
  }

  async function handleCopyLink() {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Some in-app browsers restrict the async clipboard API - fall
      // back to the older select+execCommand approach.
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand("copy");
      } catch {
        // Nothing more we can do - the user can still long-press to copy.
      }
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSms() {
    const url = getUrl();
    const message = `Check out ${puppyName}: ${url}`;
    // iOS wants "&body=", Android (and most others) want "?body=" when no
    // recipient number is included in the URI.
    const separator = isIOS() ? "&" : "?";
    window.location.href = `sms:${separator}body=${encodeURIComponent(message)}`;
  }

  async function handleMessenger() {
    const url = getUrl();
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: puppyName, text: `Check out ${puppyName}!`, url });
        return;
      } catch {
        // User cancelled the share sheet, or it failed - fall back to Copy Link.
      }
    }
    handleCopyLink();
  }

  function handleFacebook() {
    const url = getUrl();
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=400");
  }

  return (
    <div className="share-puppy">
      <div className="share-puppy-label">
        <span aria-hidden="true">🐾</span> Share This Puppy: <span aria-hidden="true">🐾</span>
      </div>
      <div className="share-puppy-row">
        <button type="button" className="share-icon-btn" onClick={handleCopyLink} aria-label="Copy link">
          <span className="share-icon-circle share-icon-circle--link">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M9 15l6-6M10 7l1-1a3.5 3.5 0 015 5l-1 1M14 17l-1 1a3.5 3.5 0 01-5-5l1-1"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="share-icon-label">{copied ? "Copied!" : "Copy Link"}</span>
        </button>
        <button type="button" className="share-icon-btn" onClick={handleSms} aria-label="Share via text message">
          <span className="share-icon-circle share-icon-circle--sms">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M4 4h16v12H8l-4 4V4z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="share-icon-label">SMS</span>
        </button>
        <button type="button" className="share-icon-btn" onClick={handleMessenger} aria-label="Share via Messenger">
          <span className="share-icon-circle share-icon-circle--messenger">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M12 3C6.9 3 3 6.6 3 11.2c0 2.6 1.3 5 3.4 6.5V21l3.1-1.7c.8.2 1.6.3 2.5.3 5.1 0 9-3.6 9-8.2S17.1 3 12 3z"
                stroke="#fff"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="share-icon-label">Messenger</span>
        </button>
        <button type="button" className="share-icon-btn" onClick={handleFacebook} aria-label="Share on Facebook">
          <span className="share-icon-circle share-icon-circle--facebook">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z"
                stroke="#fff"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="share-icon-label">Facebook</span>
        </button>
      </div>
    </div>
  );
}
