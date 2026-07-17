export type EventState = "scheduled" | "countdown" | "live";

/**
 * The single source of truth for which public state applies.
 * Used both on the server (initial render, API recheck) and nowhere else —
 * the client never makes this decision on its own, it only displays it.
 */
export function getEventState(
  now: Date,
  countdownStartsAt: Date,
  showAt: Date
): EventState {
  if (now < countdownStartsAt) return "scheduled";
  if (now < showAt) return "countdown";
  return "live";
}
