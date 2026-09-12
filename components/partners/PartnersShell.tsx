"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";
import "./partners.css";

const TABS = [
  { href: "/partners/dashboard", label: "Dashboard" },
  { href: "/partners/commissions", label: "Commissions" },
  { href: "/partners/payouts", label: "Payouts" },
  { href: "/partners/profile", label: "Profile" },
];

export default function PartnersShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/partners/login");
    router.refresh();
  }

  return (
    <div className="partners-app">
      <div className="partners-topbar">
        <span className="partners-topbar-brand">🐾 Partner Dashboard</span>
        <button type="button" className="admin-btn" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
      <div className="partners-tabs">
        {TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} className={`partners-tab${pathname === tab.href ? " active" : ""}`}>
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="partners-main">{children}</div>
    </div>
  );
}
