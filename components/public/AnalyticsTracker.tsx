"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "../../lib/analytics/trackClient";

// The puppy detail page has its own dedicated PuppyViewTracker (mounted
// directly on that page, with the real puppy id already in hand from
// the server-fetched record) - deliberately skipped here so a single
// puppy-page load never fires two separate tracking requests.
const PUPPY_DETAIL_PATTERN = /^\/puppies\/[^/]+$/;

/**
 * Mounted once inside PublicShell (covers every page under the (public)
 * route group - Home, Available Puppies, Favorites, Puppy Finder, How
 * It Works, FAQ, Contact, Partner apply - deliberately NOT the true
 * root layout, so /admin, /partners, and the separate /get-started
 * landing page are never counted as website traffic here).
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (PUPPY_DETAIL_PATTERN.test(pathname)) return;
    trackEvent({ eventType: "page_view", path: pathname });
  }, [pathname]);

  return null;
}
