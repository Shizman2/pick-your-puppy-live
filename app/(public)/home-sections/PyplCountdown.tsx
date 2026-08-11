"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function getRemaining(targetTime: number) {
  const diff = Math.max(0, targetTime - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
  };
}

function formatShowDate(iso: string) {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  return `${datePart} · ${timePart}`;
}

export default function PyplCountdown({
  eventTitle,
  showAt,
  registrationLink,
}: {
  eventTitle: string;
  showAt: string;
  registrationLink: string;
}) {
  const targetTime = new Date(showAt).getTime();
  const [remaining, setRemaining] = useState(() => getRemaining(targetTime));

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(targetTime)), 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  return (
    <div className="pypl-countdown-box">
      <div className="pypl-countdown-title-row">
        <span style={{ color: "var(--pp-blue)", fontSize: 16 }}>📡</span>
        <span style={{ fontWeight: 800, fontSize: 16, color: "#0D1B2A" }}>{eventTitle}</span>
      </div>
      <div className="pypl-countdown-date">{formatShowDate(showAt)}</div>
      <div className="pypl-countdown-eyebrow">LIVE IN</div>
      <div className="pypl-countdown-grid">
        <div className="pypl-countdown-cell">
          <div className="pypl-countdown-num">{pad(remaining.days)}</div>
          <div className="pypl-countdown-label">DAYS</div>
        </div>
        <div className="pypl-countdown-cell">
          <div className="pypl-countdown-num">{pad(remaining.hours)}</div>
          <div className="pypl-countdown-label">HRS</div>
        </div>
        <div className="pypl-countdown-cell">
          <div className="pypl-countdown-num">{pad(remaining.mins)}</div>
          <div className="pypl-countdown-label">MIN</div>
        </div>
        <div className="pypl-countdown-cell">
          <div className="pypl-countdown-num">{pad(remaining.secs)}</div>
          <div className="pypl-countdown-label">SEC</div>
        </div>
      </div>
      <a
        href={registrationLink || "/inquire?type=pypl"}
        style={{
          display: "block",
          textAlign: "center",
          background: "var(--pp-blue)",
          color: "#fff",
          fontWeight: 800,
          fontSize: 15,
          padding: 14,
          borderRadius: 14,
          textDecoration: "none",
        }}
      >
        🎟️ Reserve Your FREE Seat →
      </a>
    </div>
  );
}
