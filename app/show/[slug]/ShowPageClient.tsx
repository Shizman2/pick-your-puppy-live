"use client";

import { useEffect, useState, useCallback } from "react";
import ScheduledScreen from "../../../components/public/ScheduledScreen";
import CountdownScreen from "../../../components/public/CountdownScreen";
import LiveScreen from "../../../components/public/LiveScreen";
import type { EventState } from "../../../lib/eventTime";
import type { EventRow } from "../../../lib/eventTypes";

interface ShowPageClientProps {
  event: EventRow;
  initialState: EventState;
  showAt: string;
  showDateDisplay: string;
  showTimeDisplay: string;
  initialLiveShowLink: string | null;
  previewMode?: boolean;
  initialRemainingMs: number;
}

function msToParts(ms: number) {
  const clamped = Math.max(0, ms);
  return {
    days: Math.floor(clamped / 86400000),
    hours: Math.floor((clamped % 86400000) / 3600000),
    minutes: Math.floor((clamped % 3600000) / 60000),
    seconds: Math.floor((clamped % 60000) / 1000),
  };
}

/**
 * Owns the client-side visual countdown tick. The countdown is purely
 * cosmetic: when it visually reaches zero, this does NOT assume the show
 * is live. It calls /api/event-status, and only switches to Live (and
 * only reveals the live link) once the server confirms show_at has
 * actually passed. If the server disagrees, the client corrects its
 * clock and keeps counting.
 */
export default function ShowPageClient({
  event,
  initialState,
  showAt,
  showDateDisplay,
  showTimeDisplay,
  initialLiveShowLink,
  previewMode = false,
  initialRemainingMs,
}: ShowPageClientProps) {
  const [state, setState] = useState<EventState>(initialState);
  const [liveShowLink, setLiveShowLink] = useState<string | null>(initialLiveShowLink);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  // Starts from the server-computed value so the very first render is
  // identical on the server and during client hydration - independently
  // calling Date.now() on each side is what previously caused a
  // "Server: 19, Client: 18" hydration mismatch (a second ticks by
  // between the two). Date.now() is only called again inside the
  // interval below, which runs purely client-side after mount.
  const [remainingMs, setRemainingMs] = useState(initialRemainingMs);

  const recheckWithServer = useCallback(async () => {
    try {
      const res = await fetch(`/api/event-status?slug=${encodeURIComponent(event.slug)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      const serverNow = new Date(data.serverTime).getTime();
      const offset = serverNow - Date.now();
      setClockOffsetMs(offset);

      if (data.state === "live") {
        setLiveShowLink(data.liveShowLink);
        setState("live");
      } else {
        setRemainingMs(new Date(showAt).getTime() - (Date.now() + offset));
      }
    } catch {
      // Network hiccup - the next tick will simply try again.
    }
  }, [showAt]);

  useEffect(() => {
    if (state !== "countdown") return;

    const interval = setInterval(() => {
      const correctedNow = Date.now() + clockOffsetMs;
      const diff = new Date(showAt).getTime() - correctedNow;

      if (diff <= 0) {
        if (previewMode) {
          setRemainingMs(0);
        } else {
          recheckWithServer();
        }
      } else {
        setRemainingMs(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state, clockOffsetMs, showAt, recheckWithServer, previewMode]);

  if (state === "scheduled") return <ScheduledScreen event={event} />;
  if (state === "live") return <LiveScreen event={event} liveShowLink={liveShowLink} />;

  const { days, hours, minutes, seconds } = msToParts(remainingMs);

  return (
    <CountdownScreen
      event={event}
      days={days}
      hours={hours}
      minutes={minutes}
      seconds={seconds}
      showDateDisplay={showDateDisplay}
      showTimeDisplay={showTimeDisplay}
    />
  );
}
