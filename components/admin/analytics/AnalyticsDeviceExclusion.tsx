"use client";

import { useEffect, useState } from "react";
import { isDeviceExcluded, setDeviceExcluded } from "../../../lib/analytics/trackClient";

/**
 * "Exclude this device from analytics" - reads/writes the
 * analytics_excluded first-party cookie directly in the browser (see
 * lib/analytics/trackClient.ts). Rendered client-side only (after
 * mount) since the cookie can only be read in the browser; this avoids
 * a server/client mismatch flash by simply not rendering the toggle's
 * current state until it's known.
 */
export default function AnalyticsDeviceExclusion() {
  const [excluded, setExcluded] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setExcluded(isDeviceExcluded());
    setReady(true);
  }, []);

  function toggle() {
    const next = !excluded;
    setDeviceExcluded(next);
    setExcluded(next);
  }

  return (
    <div className="analytics-settings-card">
      <div className="analytics-settings-row">
        <div>
          <div className="analytics-settings-title">Exclude this device from analytics</div>
          {ready && (
            <div className={`analytics-settings-status ${excluded ? "excluded" : "included"}`}>
              {excluded ? "This device is excluded from analytics." : "This device is included in analytics."}
            </div>
          )}
        </div>
        {ready && (
          <button
            type="button"
            className={`analytics-toggle${excluded ? " on" : ""}`}
            role="switch"
            aria-checked={excluded}
            onClick={toggle}
          >
            <span className="analytics-toggle-knob" />
          </button>
        )}
      </div>
    </div>
  );
}
