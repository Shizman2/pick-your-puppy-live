/**
 * Formats a date-only value (e.g. payments.paid_at - always stored as
 * UTC midnight, with no meaningful time-of-day) as its calendar date.
 * Deliberately reads it back as UTC instead of the viewer's local
 * timezone - a date-only value has nothing to convert, and doing so
 * anyway is exactly what causes "entered 8/16, displays as 8/15" in
 * any timezone behind UTC (including US Eastern). Same
 * Intl.DateTimeFormat + explicit timeZone approach as
 * lib/formatEventDateTime.ts, just fixed to "UTC" instead of a
 * variable business zone.
 */
export function formatDateOnly(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}
