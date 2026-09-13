import "../../styles/public-tokens.css";
import PublicShell from "../../components/public-site/PublicShell";
import { Nunito, Caveat } from "next/font/google";

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
      <PublicShell>{children}</PublicShell>
    </div>
  );
}
