"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

// focus + visibilitychange usually fire together when coming back to the
// tab - anything inside this window counts as the same refresh.
const DEDUPE_WINDOW_MS = 2000;

/**
 * Admin "Refresh" control, rendered on every admin page by AdminSidebar.
 *
 * router.refresh() re-runs the current page's server components against
 * the database (every admin page is force-dynamic) without a browser
 * reload, so the sidebar unread badge, Contacts, Message Center and the
 * rest of the page all update together, and client state like an open
 * conversation or a search box is kept.
 *
 * Also refreshes once when the admin comes back to the tab/app after
 * leaving it (tab hidden, or window blurred). No polling, no timers and
 * no realtime subscription - nothing hits the database while the admin
 * is away.
 */
export default function AdminRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const lastRefreshAtRef = useRef(0);
  const wasAwayRef = useRef(false);

  function refresh() {
    const now = Date.now();
    if (now - lastRefreshAtRef.current < DEDUPE_WINDOW_MS) return;
    lastRefreshAtRef.current = now;
    startTransition(() => router.refresh());
  }

  useEffect(() => {
    function markAway() {
      wasAwayRef.current = true;
    }

    function handleReturn() {
      if (!wasAwayRef.current) return;
      if (document.visibilityState !== "visible") return;
      wasAwayRef.current = false;
      refresh();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") markAway();
      else handleReturn();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", markAway);
    window.addEventListener("focus", handleReturn);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", markAway);
      window.removeEventListener("focus", handleReturn);
    };
    // refresh only reads refs and the stable router.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      className="admin-btn adminshell-refresh-btn"
      onClick={() => {
        // A manual tap always refreshes, even right after a tab-return one.
        lastRefreshAtRef.current = 0;
        refresh();
      }}
      disabled={isPending}
      aria-label="Refresh data"
      title="Reload the latest data"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="15"
        height="15"
        aria-hidden="true"
        className={isPending ? "adminshell-refresh-spin" : undefined}
      >
        <path d="M21 12a9 9 0 11-2.64-6.36M21 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{isPending ? "Refreshing…" : "Refresh"}</span>
    </button>
  );
}
