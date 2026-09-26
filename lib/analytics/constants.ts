// Shared constants for the first-party website analytics system.
// Deliberately distinct cookie names from the other two anonymous
// cookies already in this project (pp_visitor for favorites, ppl_aff
// for affiliate click attribution) - this is a separate system with a
// separate lifecycle, not a repurposing of either.

/** httpOnly, ~2 years - identifies the anonymous visitor (browser/device). */
export const ANALYTICS_VISITOR_COOKIE = "pp_av";

/** httpOnly, sliding 30-minute maxAge - identifies the current session. */
export const ANALYTICS_SESSION_COOKIE = "pp_as";

/**
 * NOT httpOnly - deliberately readable/writable by client-side JS, since
 * both the tracker (must check it before firing any beacon) and the
 * Analytics Settings toggle (must read/set it) run in the browser. It
 * holds no sensitive information, just a boolean preference.
 */
export const ANALYTICS_EXCLUSION_COOKIE = "analytics_excluded";

export const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2; // 2 years, matches pp_visitor

/**
 * A session ends after 30 minutes of inactivity. Implemented as the
 * session cookie's own sliding maxAge (reset on every tracked event) -
 * see lib/analytics/ingest.ts for why that alone is sufficient to
 * enforce this, without needing to compare timestamps server-side.
 */
export const SESSION_TIMEOUT_SECONDS = 60 * 30;

/** "Online Now" = a session with activity inside this trailing window. */
export const ONLINE_NOW_WINDOW_SECONDS = 60 * 2;

/**
 * Puppy-view repeat-protection cooldown: a visitor who rapid-refreshes
 * the same puppy's page only produces ONE puppy_view row per this
 * window, not one per refresh. Deliberately reuses the same 30-minute
 * duration as the session timeout - one number to document and reason
 * about, not two unrelated magic durations - see the exact rule
 * documented in lib/analytics/ingest.ts.
 */
export const PUPPY_VIEW_DEDUP_SECONDS = 60 * 30;

export const CTA_KEYS = ["call_now", "im_interested", "puppy_finder", "see_available_puppies"] as const;
export type CtaKey = (typeof CTA_KEYS)[number];

export const EVENT_TYPES = ["page_view", "puppy_view", "cta_click"] as const;
export type AnalyticsEventType = (typeof EVENT_TYPES)[number];

export const TRAFFIC_SOURCES = ["facebook_instagram", "google", "direct", "referral_other"] as const;
export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];
