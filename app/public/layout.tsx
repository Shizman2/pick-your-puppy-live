import "../../styles/public-tokens.css";
import PublicShell from "../../components/public-site/PublicShell";

export const metadata = {
  title: "ThePuppyPlugs.com – Find the Puppy You'll Love",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <PublicShell>{children}</PublicShell>
    </>
  );
}
