import Link from "next/link";

/**
 * "Apply Now" is a plain anchor to #apply-form, not a route change -
 * .pp-body already sets scroll-behavior:smooth globally (public-shell.css),
 * so this needs no client JS to scroll smoothly to the form section
 * further down this same page.
 *
 * partner-hero-photo intentionally has no real <img> yet - see the
 * component's own comment for why.
 */
export default function PartnerHero() {
  return (
    <section className="partner-hero">
      <div className="partner-hero-text">
        <span className="partner-hero-eyebrow">Partner Program</span>
        <h1 className="partner-hero-title">
          Love Puppies?
          <br />
          <span className="partner-hero-title-accent">
            Earn By
            <br />
            Sharing Them.
          </span>
        </h1>
        <p className="partner-hero-sub">Join The Puppy Plugs Partner Program and earn on completed puppy sales.</p>
        <a href="#apply-form" className="partner-cta-btn">
          Apply Now
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <p className="partner-hero-login">
          Already a partner? <Link href="/partners/login">Log in</Link>
        </p>
      </div>

      {/*
        No real photo asset exists anywhere in this project yet (checked
        /public, every Supabase Storage bucket, and content_blocks) - a
        photo this specific (a named spokesperson, a named Yorkie, an
        exact branded sweatshirt) has to be a real approved asset, not
        something generated here. This reserves the exact slot/sizing
        the reference shows with a placeholder treatment, so dropping
        the real file in as /public/partner-hero.jpg is a one-line swap
        with no layout changes needed.
      */}
      <div className="partner-hero-photo partner-hero-photo--placeholder">
        <span className="partner-hero-decal">
          Good Dogs
          <br />
          Change Lives
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21z" />
          </svg>
        </span>
      </div>
    </section>
  );
}
