/**
 * No footer component exists anywhere else on the public site to reuse
 * (every other public page ends at its content, with only the fixed
 * BottomNav bar below) - this is new, kept intentionally minimal to
 * match exactly what the reference shows, nothing more.
 */
export default function PartnerFooter() {
  return (
    <footer className="partner-footer">
      <div className="partner-footer-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="" />
        <div>
          <div className="partner-footer-name">ThePuppyPlugs.com</div>
          <div className="partner-footer-tagline">PUPPIES. PEOPLE. FOREVER HOMES.</div>
        </div>
      </div>
      <div className="partner-footer-motto">Good People. Great Puppies.&reg;</div>
    </footer>
  );
}
