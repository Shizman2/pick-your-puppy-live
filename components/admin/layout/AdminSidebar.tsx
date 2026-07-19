"use client";

import { useState } from "react";
import Link from "next/link";
import SignOutButton from "../SignOutButton";

export type AdminNavKey =
  | "dashboard"
  | "contacts"
  | "puppies"
  | "sales"
  | "breeders"
  | "messages"
  | "tasks"
  | "pypl"
  | "reports"
  | "website"
  | "settings";

interface NavItem {
  key: AdminNavKey;
  label: string;
  href: string | null; // null = not built yet, shown disabled
  icon: React.ReactNode;
}

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: <Icon path="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" /> },
  { key: "contacts", label: "Contacts", href: "/admin/contacts", icon: <Icon path="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6" /> },
  { key: "puppies", label: "Puppies", href: "/admin/puppies", icon: <Icon path="M12 21c4-3 7-6 7-10a5 5 0 00-9.5-2A5 5 0 005 11c0 4 3 7 7 10z" /> },
  { key: "sales", label: "Sales & Payments", href: "/admin/sales", icon: <Icon path="M12 2v20M17 7a4 4 0 00-4-3H10a3 3 0 000 6h4a3 3 0 010 6h-3a4 4 0 01-4-3" /> },
  { key: "breeders", label: "Breeders", href: "/admin/breeders", icon: <Icon path="M8 12a3 3 0 100-6 3 3 0 000 6zM16 12a3 3 0 100-6 3 3 0 000 6zM2 20c0-3 3-5 6-5s6 2 6 5M10 20c0-3 3-5 6-5s6 2 6 5" /> },
  { key: "messages", label: "Messages", href: "/admin/messages", icon: <Icon path="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" /> },
  { key: "tasks", label: "Tasks", href: "/admin/tasks", icon: <Icon path="M9 11l3 3L22 4M3 12v7a2 2 0 002 2h14a2 2 0 002-2v-7" /> },
  { key: "pypl", label: "Pick Your Puppy Live", href: "/admin", icon: <Icon path="M12 8a4 4 0 010 8M8.5 5.5a8 8 0 000 13M15.5 5.5a8 8 0 010 13M12 12h.01" /> },
  { key: "reports", label: "Reports", href: null, icon: <Icon path="M4 20V10M12 20V4M20 20v-7" /> },
  { key: "website", label: "Website", href: "/admin/website", icon: <Icon path="M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18 14 14 0 010-18z" /> },
  { key: "settings", label: "Settings", href: null, icon: <Icon path="M10.3 3h3.4l.6 2.5 2.3-1.2 2.1 2.1-1.2 2.3L20 9.3v3.4l-2.5.6 1.2 2.3-2.1 2.1-2.3-1.2-.6 2.5h-3.4l-.6-2.5-2.3 1.2-2.1-2.1 1.2-2.3L4 12.7V9.3l2.5-.6-1.2-2.3 2.1-2.1 2.3 1.2z" /> },
];

interface AdminSidebarProps {
  active: AdminNavKey;
  unreadMessageCount?: number;
  userEmail?: string | null;
  children: React.ReactNode;
}

/**
 * Persistent left navigation shell, matching the approved Puppy OS
 * mockup. Wraps every /admin page. Items with href=null point to
 * pages that don't exist yet - shown visibly disabled with a "Soon"
 * tag rather than linking anywhere or pretending to work.
 */
export default function AdminSidebar({ active, unreadMessageCount = 0, userEmail, children }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="adminshell">
      <button
        type="button"
        className="adminshell-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>

      {mobileOpen && (
        <div className="adminshell-mobile-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`adminshell-sidebar${mobileOpen ? " open" : ""}`}>
        <div className="adminshell-brand">
          <div className="adminshell-brand-icon">🐾</div>
          <div>
            <div className="adminshell-brand-name">PUPPY OS</div>
            <div className="adminshell-brand-sub">Business Command Center</div>
          </div>
        </div>

        <nav className="adminshell-nav">
          {NAV_ITEMS.map((item) =>
            item.href ? (
              <Link
                key={item.key}
                href={item.href}
                className={`adminshell-navitem${active === item.key ? " active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.key === "messages" && unreadMessageCount > 0 && (
                  <span className="adminshell-navbadge">{unreadMessageCount}</span>
                )}
              </Link>
            ) : (
              <div key={item.key} className="adminshell-navitem disabled">
                {item.icon}
                <span>{item.label}</span>
                <span className="adminshell-soon">Soon</span>
              </div>
            )
          )}
        </nav>

        <div className="adminshell-footer">
          <div className="adminshell-user">
            <div className="adminshell-user-avatar">{(userEmail || "A")[0].toUpperCase()}</div>
            <div>
              <div className="adminshell-user-name">{userEmail || "Admin"}</div>
              <div className="adminshell-user-role">Administrator</div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="adminshell-main">{children}</main>
    </div>
  );
}
