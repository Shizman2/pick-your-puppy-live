import "../../styles/public-tokens.css";
import PublicShell from "../../components/public-site/PublicShell";
import { Nunito } from "next/font/google";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
  variable: "--pp-font-family",
});

export const metadata = {
  title: "ThePuppyPlugs.com – Find the Puppy You'll Love",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={nunito.variable}>
      <PublicShell>{children}</PublicShell>
    </div>
  );
}
