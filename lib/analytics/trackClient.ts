// Client-safe helper for the first-party website analytics system - no
// "server-only" import here, and no "use client" needed at module level
// since this file just exports plain functions for client components to
// call (components/public/AnalyticsTracker.tsx, PuppyViewTracker.tsx,
// and any CTA component that calls trackCta()).

const EXCLUSION_COOKIE = "analytics_excluded";
const TRACK_ENDPOINT = "/api/analytics/track";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/**
 * Checked BEFORE any network request is made, in every tracking call
 * below - the point of checking client-side (in addition to the
 * ingestion route re-checking server-side) is that an excluded device
 * makes zero analytics network calls at all, not just zero recorded
 * database rows.
 */
export function isDeviceExcluded(): boolean {
  return readCookie(EXCLUSION_COOKIE) === "true";
}

export function setDeviceExcluded(excluded: boolean): void {
  if (typeof document === "undefined") return;
  if (excluded) {
    // 2 years - matches the lifetime of the other first-party cookies
    // in this project (pp_visitor, pp_av).
    document.cookie = `${EXCLUSION_COOKIE}=true; path=/; max-age=${60 * 60 * 24 * 365 * 2}; samesite=lax`;
  } else {
    document.cookie = `${EXCLUSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
}

export type TrackCtaKey = "call_now" | "im_interested" | "puppy_finder" | "see_available_puppies";

interface TrackEventPayload {
  eventType: "page_view" | "puppy_view" | "cta_click";
  path: string;
  puppyId?: string;
  ctaKey?: TrackCtaKey;
}

function utmParamsFromLocation(): Record<string, string | null> {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmContent: params.get("utm_content"),
    utmTerm: params.get("utm_term"),
  };
}

/**
 * Fire-and-forget analytics beacon. Never throws, never blocks the
 * caller, and never delays navigation - uses navigator.sendBeacon
 * (purpose-built for exactly this "fire this off right as the page is
 * unloading" case, e.g. clicking a CTA link) with a fetch(keepalive)
 * fallback for browsers/situations where sendBeacon isn't available.
 * A failed or skipped analytics call never affects the visitor's
 * experience in any way.
 */
export function trackEvent(payload: TrackEventPayload): void {
  if (typeof window === "undefined") return;
  if (isDeviceExcluded()) return;

  const body = JSON.stringify({
    ...payload,
    referrer: document.referrer || null,
    ...utmParamsFromLocation(),
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(TRACK_ENDPOINT, blob)) return;
    }
  } catch {
    // Fall through to fetch below.
  }

  fetch(TRACK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    keepalive: true,
    body,
  }).catch(() => {
    // Best-effort only.
  });
}

/** Convenience wrapper for the four approved V1 CTA buttons/links. */
export function trackCta(ctaKey: TrackCtaKey, puppyId?: string): void {
  if (typeof window === "undefined") return;
  trackEvent({ eventType: "cta_click", path: window.location.pathname, ctaKey, puppyId });
}
