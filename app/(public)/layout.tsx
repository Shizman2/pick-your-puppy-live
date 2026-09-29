import "../../styles/public-tokens.css";
import PublicShell from "../../components/public-site/PublicShell";
import { Nunito, Caveat } from "next/font/google";
import Script from "next/script";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
  variable: "--pp-font-family",
});

// Used only for the handwritten-note accents on the Partner Program page
// (the "How You Earn" decal) - see partner-landing.css.
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  variable: "--pp-font-cursive",
});

export const metadata = {
  title: "ThePuppyPlugs.com – Find the Puppy You'll Love",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${nunito.variable} ${caveat.variable}`}>
      {/* GHL External Tracking - Pick Your Puppy Live sub-account. Mounted
          once here (not per-page) so it loads on every public route,
          including puppy detail pages, without duplicating the script tag.
          data-debug is temporary for initial GHL-side verification. */}
      <Script
        src="https://link.msgsndr.com/js/external-tracking.js"
        data-tracking-id="tk_f103b6de46a740ba963abcb95e02276d"
        data-debug="true"
        strategy="afterInteractive"
      />
      <PublicShell>{children}</PublicShell>
    </div>
  );
}
