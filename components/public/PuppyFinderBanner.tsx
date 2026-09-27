import TrackedLink from "./TrackedLink";

/**
 * /public/puppyfinderbanner (2).png is 1920x819. Its own yellow "Use Our
 * Puppy Finder Service" button is baked in starting at row 611 (measured
 * by scanning the PNG's own pixel data for that button's exact color
 * range, not eyeballed) - so the artwork-only portion (headline, puppy
 * photo, supporting text) ends at 606px, just above it. Expressed as an
 * aspect-ratio so the crop stays exact at any viewport width: the CSS
 * box is always exactly the top 606/819 of the image, the baked-in
 * button and the empty margin below it are cropped off by the browser,
 * never re-rendered or distorted.
 */
const ART_ASPECT_RATIO = "1920 / 606";

interface PuppyFinderBannerProps {
  /**
   * Preserves puppy context on the tracked click, same as this page's
   * other CTAs (Call Now, I'm Interested) - no analytics schema change:
   * cta_click already supports an optional puppy_id column.
   */
  puppyId?: string;
}

/**
 * Closing "Don't see the puppy you want?" banner rendered at the bottom
 * of every puppy detail page (see app/(public)/puppies/[slug]/page.tsx).
 * Two pieces, deliberately not one clickable image:
 *   1. The artwork (headline/photo/supporting copy) - cropped to exclude
 *      the PNG's own baked-in yellow button, never itself a link.
 *   2. A real HTML button below it, styled to match that baked-in
 *      button (same yellow/navy/label), which is the only clickable
 *      part of this section.
 * This avoids ever showing two competing "Use Our Puppy Finder Service"
 * buttons, and avoids the entire artwork being an accidental tap target.
 *
 * Reuses TrackedLink (components/public/TrackedLink.tsx) - the same
 * tracking utility already wired to the existing "puppy_finder" CTA key
 * used everywhere else Puppy Finder is promoted, so this click lands in
 * the same Analytics > CTA Activity > Puppy Finder bucket as those.
 */
export default function PuppyFinderBanner({ puppyId }: PuppyFinderBannerProps) {
  return (
    <div className="puppy-finder-banner">
      <div className="puppy-finder-banner-art" style={{ aspectRatio: ART_ASPECT_RATIO }}>
        <img
          src="/puppyfinderbanner%20(2).png"
          alt="Don't see the puppy you want? Let us find it for you. Tell us what you're looking for and we'll find 3-5 options from our trusted breeders just for you."
          className="puppy-finder-banner-img"
        />
      </div>
      <TrackedLink href="/puppy-finder" ctaKey="puppy_finder" puppyId={puppyId} className="puppy-finder-banner-cta">
        Use Our Puppy Finder Service <span className="puppy-finder-banner-cta-chevron">›</span>
      </TrackedLink>
    </div>
  );
}
