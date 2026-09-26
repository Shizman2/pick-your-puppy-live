import TrackedLink from "./TrackedLink";

/**
 * Precise bounding box of the yellow "Use Our Puppy Finder Service"
 * button baked into /public/puppyfinderbanner.png (1920x819 source),
 * measured by scanning the PNG's own pixel data for that button's exact
 * color range - not eyeballed from a preview. Expressed as percentages
 * of the image's own box (not fixed px) so the invisible clickable
 * region stays aligned with the visible yellow button as the image
 * scales responsively at any viewport width.
 */
const CTA_REGION = {
  left: 3.44,
  top: 75.34,
  width: 52.81,
  height: 13.92,
};

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
 * The PNG is the only source of the CTA's visible styling - this
 * component adds nothing visible on top of it, only a precisely
 * positioned invisible clickable region over the yellow button itself.
 * The rest of the banner (headline, icons, puppy photo) is intentionally
 * NOT clickable, to avoid accidental taps while scrolling.
 *
 * Reuses TrackedLink (components/public/TrackedLink.tsx) - the same
 * tracking utility already wired to the existing "puppy_finder" CTA key
 * used everywhere else Puppy Finder is promoted, so this click lands in
 * the same Analytics > CTA Activity > Puppy Finder bucket as those.
 */
export default function PuppyFinderBanner({ puppyId }: PuppyFinderBannerProps) {
  return (
    <div className="puppy-finder-banner">
      <img
        src="/puppyfinderbanner.png"
        alt="Don't see the puppy you want? Let us find it for you. Tell us what you're looking for and we'll find 3-5 options from our trusted breeders just for you."
        className="puppy-finder-banner-img"
      />
      <TrackedLink
        href="/puppy-finder"
        ctaKey="puppy_finder"
        puppyId={puppyId}
        className="puppy-finder-banner-cta"
        aria-label="Use Our Puppy Finder Service"
        style={{
          left: `${CTA_REGION.left}%`,
          top: `${CTA_REGION.top}%`,
          width: `${CTA_REGION.width}%`,
          height: `${CTA_REGION.height}%`,
        }}
      />
    </div>
  );
}
