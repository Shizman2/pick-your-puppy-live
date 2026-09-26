"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "../../lib/analytics/trackClient";

/**
 * Mounted directly on the puppy detail page with the real puppy id
 * already in hand (no slug-to-id lookup needed server-side). Fires the
 * single tracking call for that page load - the server records it as a
 * page_view unconditionally, and additionally as a puppy_view subject
 * to the repeat-protection cooldown (see lib/analytics/ingest.ts).
 */
export default function PuppyViewTracker({ puppyId }: { puppyId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    trackEvent({ eventType: "puppy_view", path: pathname, puppyId });
    // Fires once per mount - Next.js remounts this whole page tree when
    // the [slug] route param changes, so this already re-fires per puppy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
