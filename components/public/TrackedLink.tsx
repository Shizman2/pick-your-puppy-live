"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackCta, type TrackCtaKey } from "../../lib/analytics/trackClient";

interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  ctaKey: TrackCtaKey;
  puppyId?: string;
}

/**
 * Drop-in replacement for a plain <a> on the small, deliberately-fixed
 * set of intentional primary CTA locations (see the approved V1 scope -
 * NOT every internal link to /puppies or /puppy-finder, just the
 * marketing CTAs). Fires a fire-and-forget tracking beacon on click and
 * then lets the click proceed/navigate completely normally - never
 * preventDefault, never delays or blocks the link.
 */
export default function TrackedLink({ ctaKey, puppyId, onClick, children, ...anchorProps }: TrackedLinkProps) {
  return (
    <a
      {...anchorProps}
      onClick={(e) => {
        trackCta(ctaKey, puppyId);
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
