import "./inquire.css";
import InquireForm from "../../components/inquire/InquireForm";
import { createAdminClient } from "../../lib/supabase/admin";
import { formatShowDate, formatShowTime } from "../../lib/formatEventDateTime";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["puppy_interest", "puppy_finder", "pypl", "general"];

/**
 * Public, hosted inquiry form - lives inside this app rather than
 * being embedded cross-domain into iheartpuppy.com. That site's
 * buttons link here with query params that preselect the right
 * intent, e.g. /inquire?type=puppy&puppy=Leo
 *
 * For ?type=pypl specifically, this becomes a dedicated registration
 * screen (no other options shown) - the event's real date/time is
 * fetched here so it can be displayed, matching the approved PYPL flow.
 */
export default async function InquirePage({
  searchParams,
}: {
  searchParams: { type?: string; puppy?: string; slug?: string };
}) {
  const rawType = searchParams.type;
  const typeMap: Record<string, string> = {
    puppy: "puppy_interest",
    finder: "puppy_finder",
    pypl: "pypl",
    general: "general",
  };

  const resolvedType =
    (rawType && typeMap[rawType]) ||
    (rawType && VALID_TYPES.includes(rawType) ? rawType : null) ||
    "general";

  let eventDateDisplay: string | null = null;
  let eventTimeDisplay: string | null = null;

  if (resolvedType === "pypl") {
    const admin = createAdminClient();
    const { data: event } = await admin
      .from("events")
      .select("show_at, show_timezone, status")
      .limit(1)
      .maybeSingle();

    if (event && event.status === "published") {
      eventDateDisplay = formatShowDate(event.show_at, event.show_timezone);
      eventTimeDisplay = formatShowTime(event.show_at, event.show_timezone);
    }
  }

  return (
    <div className="inquire-shell">
      <div className="inquire-inner">
        <InquireForm
          initialType={resolvedType as "puppy_interest" | "puppy_finder" | "pypl" | "general"}
          initialPuppyName={searchParams.puppy}
          initialPuppySlug={searchParams.slug}
          eventDateDisplay={eventDateDisplay}
          eventTimeDisplay={eventTimeDisplay}
        />
      </div>
    </div>
  );
}
