import type { TrafficSource } from "./constants";

/**
 * V1 traffic-source classification - simple and explainable, not a
 * real attribution model. Checked in this order:
 *   1. utm_source or the referrer's hostname mentions Facebook/Instagram
 *   2. utm_source or the referrer's hostname mentions Google
 *   3. no referrer and no utm_source at all -> Direct
 *   4. anything else with a referrer/utm_source -> Referral / Other
 *
 * The raw referrer and all five raw utm_* fields are always stored on
 * the session regardless of which bucket this function returns (see
 * lib/analytics/ingest.ts) - this function only decides the simplified
 * V1 dashboard label, it never discards the underlying data.
 */
export function classifyTrafficSource(referrer: string | null, utmSource: string | null): TrafficSource {
  const source = (utmSource || "").toLowerCase();
  let referrerHost = "";
  if (referrer) {
    try {
      referrerHost = new URL(referrer).hostname.toLowerCase();
    } catch {
      referrerHost = "";
    }
  }

  if (
    source.includes("facebook") ||
    source.includes("instagram") ||
    source === "fb" ||
    source === "ig" ||
    referrerHost.includes("facebook.com") ||
    referrerHost.includes("instagram.com") ||
    referrerHost.includes("fb.com") ||
    referrerHost.includes("l.facebook.com")
  ) {
    return "facebook_instagram";
  }

  if (source.includes("google") || referrerHost.includes("google.")) {
    return "google";
  }

  if (!referrer && !utmSource) {
    return "direct";
  }

  return "referral_other";
}
