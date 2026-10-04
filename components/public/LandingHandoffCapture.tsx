"use client";

import { useEffect } from "react";
import { isNonProductionEnvironmentClient } from "../../lib/analytics/environment";
import { isDeviceExcluded } from "../../lib/analytics/trackClient";

const HANDOFF_PARAM = "pp_lv";
const HANDLED_FLAG_KEY = "pp_lv_handled";
const HANDOFF_ENDPOINT = "/api/analytics/landing-handoff";

/**
 * Captures the cross-domain attribution handoff from the GHL /start
 * landing page (pickyourpuppylive.com) - see the GHL tracking snippet
 * and app/api/analytics/landing-handoff/route.ts. Mounted once inside
 * PublicShell, next to AnalyticsTracker, so it runs on whichever public
 * page the visitor actually lands on (today that's always /puppies, per
 * the CTA, but nothing here hardcodes that one path).
 */
export default function LandingHandoffCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isNonProductionEnvironmentClient()) return;
    if (isDeviceExcluded()) return;

    let landingVisitorId: string | null = null;
    try {
      landingVisitorId = new URLSearchParams(window.location.search).get(HANDOFF_PARAM);
    } catch {
      return;
    }
    if (!landingVisitorId) return;

    // Defense-in-depth against a double-fire within the same tab - the
    // URL itself is cleaned below, so a real page refresh never
    // re-triggers this at all; this guard only covers an unusual
    // same-tab remount before that cleanup takes effect.
    try {
      if (window.sessionStorage.getItem(HANDLED_FLAG_KEY) === landingVisitorId) return;
      window.sessionStorage.setItem(HANDLED_FLAG_KEY, landingVisitorId);
    } catch {
      // sessionStorage unavailable - proceed anyway. Worst case is one
      // possible duplicate attempt, which the server already treats as
      // a no-op (first-write-wins - see the handoff route).
    }

    fetch(HANDOFF_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ landingVisitorId }),
    }).catch(() => {
      // Best-effort only - never block or alter the visitor's experience.
    });

    // Strip the handoff param from the visible URL right away - doesn't
    // need to wait for the fetch above, since the server call above
    // doesn't depend on the URL staying intact.
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete(HANDOFF_PARAM);
      window.history.replaceState(null, "", url.toString());
    } catch {
      // Leave the URL as-is if this fails for any reason.
    }
  }, []);

  return null;
}
