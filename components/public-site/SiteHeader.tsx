"use client";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Puppies", href: "/puppies" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export default function SiteHeader({
  open,
  onToggle,
  onClose,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <header className="pp-header">
        <div className="pp-logo">
          <img src="/logo-icon.png" alt="ThePuppyPlugs.com" />
          <span className="pp-logo-text">
            ThePuppyPlugs<span>.com</span>
          </span>
        </div>
        <button className="pp-hamburger" aria-label="Menu" onClick={onToggle}>
          <span />
          <span />
          <span />
        </button>
      </header>
      <nav className={`pp-mobile-nav${open ? " pp-open" : ""}`}>
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={onClose}>
            {link.label}
          </a>
        ))}
      </nav>
    </>
  );
}
