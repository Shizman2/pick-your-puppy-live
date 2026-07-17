import "./globals.css";

export const metadata = {
  title: "Pick Your Puppy Live",
  description: "Private waiting room for registered Pick Your Puppy Live attendees.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
