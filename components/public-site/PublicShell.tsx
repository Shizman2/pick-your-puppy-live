"use client";

import { useEffect, useRef, useState } from "react";
import SiteHeader from "./SiteHeader";
import BottomNav from "./BottomNav";
import "./public-shell.css";

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
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
    <div ref={shellRef} className="pp-html-reset pp-body">
      <SiteHeader
        open={navOpen}
        onToggle={() => setNavOpen((v) => !v)}
        onClose={() => setNavOpen(false)}
      />
      {children}
      <BottomNav />
    </div>
  );
}
