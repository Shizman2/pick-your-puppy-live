// Single source of truth for "is this a non-production environment" -
// checked both client-side (before any tracking call fires at all, so
// an excluded environment makes zero network calls - same principle as
// device exclusion) and server-side (defense in depth, mirroring how
// device exclusion is itself checked in both places - see
// lib/analytics/trackClient.ts and lib/analytics/ingest.ts). Hostname-
// based, never IP-based, per explicit instruction.

const NON_PRODUCTION_HOSTNAME_SUBSTRINGS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  // Covers deploy-preview-*, branch-deploy subdomains, and the default
  // *.netlify.app subdomain generally - the real production site is
  // served from its own custom domain, never this subdomain.
  ".netlify.app",
];

export function isNonProductionHostname(hostname: string | null | undefined): boolean {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  return NON_PRODUCTION_HOSTNAME_SUBSTRINGS.some((needle) => host.includes(needle));
}

/**
 * Client-side check - window.location.hostname is exactly what the
 * visitor's browser actually loaded, so this agrees with what a human
 * would call "am I looking at the real site right now."
 */
export function isNonProductionEnvironmentClient(): boolean {
  if (typeof window === "undefined") return false;
  return isNonProductionHostname(window.location.hostname);
}

/**
 * Server-side check, combining independent signals so this stays
 * correct even if one is ever misconfigured:
 *   1. NODE_ENV - always "development" under `next dev`, catching
 *      localhost testing immediately, before any request even exists.
 *   2. Netlify's own CONTEXT env var - "production" only for the real
 *      production deploy; "deploy-preview"/"branch-deploy"/"dev" for
 *      everything else Netlify builds. Netlify's build step sets
 *      NODE_ENV=production even for preview builds, so CONTEXT is the
 *      signal that actually distinguishes them - NODE_ENV alone is not
 *      enough to exclude Netlify previews.
 *   3. The request's own Host header, checked against the same
 *      hostname patterns as the client-side check - a safety net that
 *      doesn't depend on any particular env var being set correctly.
 */
export function isNonProductionEnvironmentServer(hostHeader: string | null | undefined): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.CONTEXT && process.env.CONTEXT !== "production") return true;
  return isNonProductionHostname(hostHeader);
}
