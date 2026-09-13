import Link from "next/link";

/**
 * The approved banner (public/partner-hero-banner.webp) is a single
 * flattened graphic - headline, subcopy, the "Apply Now" button, and
 * the "Log in" line are all baked into the image's pixels, not real
 * HTML. To make those two spots actually clickable, this overlays two
 * invisible, percentage-positioned link regions on top of the image
 * instead of rebuilding the button/text in HTML (which would either
 * duplicate what's already drawn in the image or require cropping it).
 *
 * The percentages were measured against the banner's actual pixel
 * dimensions (1448x1086) and are approximate - nudge them here if a
 * tap zone feels slightly off on a real device.
 */
export default function PartnerHero() {
  return (
    <section className="partner-hero">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="partner-hero-banner-img"
        src="/partner-hero-banner.webp"
        alt="Partner Program - Love Puppies? Earn By Sharing Them. Join The Puppy Plugs Partner Program and earn on completed puppy sales."
      />
      <a href="#apply-form" className="partner-hero-hotspot partner-hero-hotspot--apply" aria-label="Apply Now - scroll to the application form" />
      <Link href="/partners/login" className="partner-hero-hotspot partner-hero-hotspot--login" aria-label="Log in to your partner account" />
    </section>
  );
}
