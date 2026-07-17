import ShowPageClient from "./ShowPageClient";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { getEventState, type EventState } from "../../../lib/eventTime";
import { formatShowDate, formatShowTime } from "../../../lib/formatEventDateTime";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const VALID_PREVIEW_STATES: EventState[] = ["scheduled", "countdown", "live"];

/**
 * Server component: reads the real event row, computes the correct
 * initial state using the server's own clock, and only includes the
 * live-show link if the show has actually started.
 *
 * Preview override: if ?preview=scheduled|countdown|live is present,
 * it's only honored after confirming there's a real logged-in admin
 * session server-side. Anyone else visiting the same URL with that
 * parameter just gets the real, current state instead - the parameter
 * itself grants no access. Even in a forced "live" preview, the real
 * live_show_link is never revealed; the button stays a placeholder.
 */
export default async function ShowPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { preview?: string };
}) {
  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("events")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !event) {
    return (
      <div style={{ padding: 40, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
        DEBUG: Event query failed or returned nothing.{"\n"}
        slug requested: {params.slug}
        {"\n"}error: {error ? JSON.stringify(error, null, 2) : "none"}
      </div>
    );
  }

  const now = new Date();
  const countdownStartsAt = new Date(event.countdown_starts_at);
  const showAt = new Date(event.show_at);
  let state = getEventState(now, countdownStartsAt, showAt);
  let liveShowLink: string | null = state === "live" ? event.live_show_link : null;
  let previewMode = false;
  let debugAuthNote = "no preview param present";
  const initialRemainingMs = showAt.getTime() - now.getTime();

  const requestedPreview = searchParams.preview;
  if (requestedPreview && VALID_PREVIEW_STATES.includes(requestedPreview as EventState)) {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (user) {
      state = requestedPreview as EventState;
      previewMode = true;
      liveShowLink = null;
      debugAuthNote = `preview honored for user: ${user.email}`;
    } else {
      debugAuthNote = `preview param present but no valid session. authError: ${
        authError ? authError.message : "none, user just null"
      }`;
    }
  }

  if (!previewMode && event.status !== "published") {
    return (
      <div style={{ padding: 40, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
        DEBUG: Blocked - event status is &quot;{event.status}&quot;, not
        &quot;published&quot;, and preview was not honored.{"\n"}
        {"\n"}requested preview param: {requestedPreview ?? "(none)"}
        {"\n"}auth check result: {debugAuthNote}
      </div>
    );
  }

  return (
    <ShowPageClient
      event={event}
      initialState={state}
      showAt={event.show_at}
      showDateDisplay={formatShowDate(event.show_at, event.show_timezone)}
      showTimeDisplay={formatShowTime(event.show_at, event.show_timezone)}
      initialLiveShowLink={liveShowLink}
      previewMode={previewMode}
      initialRemainingMs={initialRemainingMs}
    />
  );
}

