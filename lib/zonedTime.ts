import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

/**
 * Converts a local date + time entered in the admin form (in the given
 * IANA zone) into an absolute UTC ISO timestamp for storage. Handles
 * DST automatically via the IANA zone rules - no manual offset math.
 */
export function localToUtcIso(dateStr: string, timeStr: string, timeZone: string): string {
  const localDateTimeStr = `${dateStr}T${timeStr}:00`;
  return fromZonedTime(localDateTimeStr, timeZone).toISOString();
}

/**
 * The reverse: given a stored UTC timestamp and IANA zone, reconstructs
 * the local date/time strings for the admin form's inputs. This is why
 * separate date/time fields don't need to be stored - they're always
 * derivable from show_at + show_timezone.
 */
export function utcToLocalParts(iso: string, timeZone: string): { date: string; time: string } {
  const date = formatInTimeZone(new Date(iso), timeZone, "yyyy-MM-dd");
  const time = formatInTimeZone(new Date(iso), timeZone, "HH:mm");
  return { date, time };
}
