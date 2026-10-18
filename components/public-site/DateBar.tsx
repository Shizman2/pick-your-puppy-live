"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./date-bar.css";

// Slim navy strip above the header with today's date in Eastern Time.
// The date is rendered only in the browser (pages are cached/static, so a
// server-rendered date could be stale and would mismatch on hydration);
// the server renders the same empty, fixed-height strip.

const TIME_ZONE = "America/New_York";

/** "Sunday, October 18, 2026", or "Sun, Oct 18, 2026" when the long form doesn't fit. */
function easternDateLabel(now = new Date(), short = false): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: short ? "short" : "long",
    month: short ? "short" : "long",
    day: "numeric",
    year: "numeric",
  }).format(now);
}

/** Milliseconds until the next Eastern-time midnight (plus a 1s cushion). */
function msUntilEasternMidnight(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
  const elapsed = get("hour") * 3600 + get("minute") * 60 + get("second");
  return Math.max(1000, (86400 - elapsed) * 1000 + 1000);
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="16.5" rx="3" stroke="currentColor" strokeWidth="2.2" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="13" y="13" width="4.2" height="4.2" rx="1" fill="currentColor" />
    </svg>
  );
}

export default function DateBar() {
  const [now, setNow] = useState<Date | null>(null);
  const [short, setShort] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      setNow(new Date());
      clearTimeout(timer);
      timer = setTimeout(refresh, msUntilEasternMidnight());
    };
    refresh();
    // Timers pause in background tabs; re-check when the tab comes back.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Use the full "Wednesday, September 30, 2026" when it fits; on narrow
  // screens or long dates, fall back to "Wed, Sep 30, 2026" instead of
  // cutting it off. Measured off-screen (canvas) against the free space in
  // the bar, so React's text is never touched directly.
  useLayoutEffect(() => {
    if (!now) return;
    const fit = () => {
      const text = textRef.current;
      const bar = text?.closest(".pp-datebar-inner") as HTMLElement | null;
      const link = bar?.querySelector(".pp-datebar-link") as HTMLElement | null;
      const icon = bar?.querySelector(".pp-datebar-icon") as HTMLElement | null;
      const group = text?.parentElement;
      if (!text || !bar || !link || !icon || !group) return;
      const barStyle = getComputedStyle(bar);
      const free =
        bar.clientWidth -
        parseFloat(barStyle.paddingLeft) -
        parseFloat(barStyle.paddingRight) -
        parseFloat(barStyle.columnGap || "0") -
        link.offsetWidth -
        icon.offsetWidth -
        parseFloat(getComputedStyle(group).columnGap || "0");
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return;
      const ts = getComputedStyle(text);
      ctx.font = `${ts.fontWeight} ${ts.fontSize} ${ts.fontFamily}`;
      setShort(ctx.measureText(easternDateLabel(now, false)).width > free - 1);
    };
    fit();
    // The site font loads after first paint; measure again once it's in.
    document.fonts?.ready.then(fit).catch(() => undefined);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [now]);

  return (
    <div className="pp-datebar">
      <div className="pp-datebar-inner">
        <span className="pp-datebar-date">
          <span className="pp-datebar-icon">
            <CalendarIcon />
          </span>
          <span ref={textRef} suppressHydrationWarning>
            {now ? easternDateLabel(now, short) : ""}
          </span>
        </span>
        <a className="pp-datebar-link" href="/puppies">
          Browse Available Puppies
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </div>
  );
}
