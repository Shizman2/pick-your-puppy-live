/**
 * Phase 2 placeholder only. Shape mirrors the planned `events` table
 * so swapping this for a real Supabase row in Phase 4 requires no
 * component changes, only a different data source.
 */
export const fakeEvent = {
  slug: "sample-show",
  status: "published",

  // Real absolute UTC timestamps, matching the planned events table.
  // Countdown starts in the recent past so the demo opens in the
  // Countdown state; change to a future date to see the Scheduled state.
  countdownStartsAt: "2026-07-01T00:00:00.000Z",
  showAt: "2026-07-25T23:00:00.000Z", // 7:00 PM on July 25, 2026, America/New_York (EDT, UTC-4)
  showTimezone: "America/New_York",

  // Hidden from any public response until the server confirms showAt has passed.
  liveShowLink: "https://pickyourpuppylive.com/live/show",

  featuredImageUrl: null, // no real upload yet; screens show a placeholder frame

  scheduledHeadline: "The next Pick Your Puppy Live show is coming soon.",
  scheduledMessage: "The waiting room opens Monday, July 20 at 9:00 AM ET.",
  scheduledHelperMessage: "Keep this page bookmarked. Return when the waiting room opens.",

  countdownHeadline: "The Live Puppy Show Starts In",
  countdownHelperMessage:
    "Keep this page open. The live show will begin here automatically.",

  liveHeadline: "WE\u2019RE LIVE!",
  liveMessage: "The show is happening now.",
  liveButtonLabel: "ENTER THE LIVE SHOW",

  privateWaitingMessage: "Private waiting room for registered attendees.",
  privateLiveMessage: "This link is for registered attendees only.",
};
