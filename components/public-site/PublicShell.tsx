"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";
import DateBar from "./DateBar";
import BottomNav from "./BottomNav";
import AnalyticsTracker from "../public/AnalyticsTracker";
import LandingHandoffCapture from "../public/LandingHandoffCapture";
import AssistantWidget from "../public/assistant/AssistantWidget";
import "./public-shell.css";

// Focused flows with their own back link and no fixed bottom nav.
const NO_BOTTOM_NAV = /^\/puppies\/[^/]+\/contact\/?$/;

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const showBottomNav = !NO_BOTTOM_NAV.test(usePathname() || "");
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (shellRef.current && !shellRef.current.contains(e.target as Node)) {
        setNavOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      {/* Outside the 430px page column so the navy strip spans the full screen width. */}
      <DateBar />
      <div ref={shellRef} className={`pp-html-reset pp-body${showBottomNav ? "" : " pp-body--no-bottom-nav"}`}>
      <AnalyticsTracker />
      <LandingHandoffCapture />
      <SiteHeader
        open={navOpen}
        onToggle={() => setNavOpen((v) => !v)}
        onClose={() => setNavOpen(false)}
      />
      {children}
      {showBottomNav && <BottomNav />}
      <AssistantWidget hasBottomNav={showBottomNav} />
      </div>
    </>
  );
}
