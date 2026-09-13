/**
 * The one place affiliate-tracked internal URLs get built - every
 * referral link in the app (dashboard homepage link, admin's per-
 * affiliate link, Marketing Center puppy/Puppy Finder links) goes
 * through this instead of hand-concatenating "?ref=" per page.
 *
 * Uses the URL constructor so an existing query string on the
 * destination path is preserved rather than clobbered - `ref` is set
 * (added or overwritten) alongside whatever else is already there.
 *
 * Client-only (relies on window.location.origin) - every current call
 * site is a "use client" component. If a server-rendered call site
 * shows up later, pass an explicit origin instead of adding a
 * server-side fallback nobody has needed yet.
 */
export function generateAffiliateUrl(path: string, referralCode: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = new URL(path, origin || "https://thepuppyplugs.com");
  url.searchParams.set("ref", referralCode);
  return url.toString();
}
