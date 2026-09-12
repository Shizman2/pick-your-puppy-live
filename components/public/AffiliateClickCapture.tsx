"use client";

import { useEffect } from "react";

/**
 * Mounted once in the root layout so an affiliate link works no matter
 * which page it points to (?ref=CODE on the homepage, a puppy page,
 * puppy-finder, etc.) - not handled in middleware, which stays scoped
 * to just the admin/affiliate auth gate (see middleware.ts's comment).
 * Fires at most once per page load and only when ?ref= is present, so
 * normal page views never make this extra request.
 */
export default function AffiliateClickCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref");
    if (!code) return;

    fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code, landingPath: window.location.pathname }),
    }).catch(() => {
      // Best-effort only - a failed click record never blocks the page.
    });
  }, []);

  return null;
}
