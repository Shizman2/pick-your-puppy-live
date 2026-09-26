"use client";

import { useEffect, useState } from "react";
import { PawIcon } from "./icons";
import type { OnlineNowData } from "../../../lib/analytics/queries";

const POLL_INTERVAL_MS = 20000;

/**
 * Always real-time, independent of the page's historical date filter.
 * Renders the server-fetched initial count immediately, then polls the
 * admin-only /api/analytics/online-now endpoint every ~20 seconds - not
 * "every second," per the approved spec's explicit instruction to avoid
 * unnecessary load.
 */
export default function OnlineNowWidget({ initial }: { initial: OnlineNowData }) {
  const [data, setData] = useState<OnlineNowData>(initial);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/analytics/online-now", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as OnlineNowData;
        if (!cancelled) setData(json);
      } catch {
        // Best-effort - keep showing the last known data on a failed poll.
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="analytics-card-title">Online Now</div>
      </div>

      <div className="analytics-online-headline">
        <span className="analytics-online-dot" />
        <span className="analytics-online-count">
          {data.count} Visitor{data.count === 1 ? "" : "s"} Online Now
        </span>
      </div>
      <div className="analytics-online-sub">Active in the last 2 minutes</div>

      {data.pages.length > 0 && (
        <div className="analytics-online-pages">
          {data.pages.map((p) => (
            <div key={p.label} className="analytics-online-page-row">
              <span className="analytics-online-page-icon">
                <PawIcon />
              </span>
              <span className="analytics-online-page-label">Viewing {p.label}</span>
              <span className="analytics-online-page-count">{p.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
