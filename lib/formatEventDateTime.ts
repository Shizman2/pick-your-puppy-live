/**
 * Converts a stored UTC timestamp + IANA time zone into display strings.
 * Intl.DateTimeFormat resolves DST correctly for the given zone and date,
 * so no separate daylight-saving logic is needed anywhere else.
 */
export function formatShowDate(iso: string, timeZone: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(date);
}

export function formatShowTime(iso: string, timeZone: string): string {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);

  const zoneAbbrev =
    new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
      timeZone,
    })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? "";

  return `${time} ${zoneAbbrev}`;
}
