/**
 * Shared phone-number display/dialing/typing utilities. The stored
 * value in the database is never rewritten by these - they only
 * affect how a number is shown or how a tel: link is built, so
 * existing rows never need a backfill just to gain dashes.
 */

/** Returns the 10 significant US digits if `raw` can clearly be read as a standard US number, otherwise null (never guesses on international/unusual numbers). */
function extractUsTenDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits[0] === "1") return digits.slice(1);
  return null;
}

/** 6094406809 / (609) 440-6809 / 609 440 6809 -> "609-440-6809". Anything that isn't a clean 10/11-digit US number is returned as-is, untouched. */
export function formatPhoneDisplay(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const tenDigits = extractUsTenDigits(trimmed);
  if (!tenDigits) return trimmed;
  return `${tenDigits.slice(0, 3)}-${tenDigits.slice(3, 6)}-${tenDigits.slice(6)}`;
}

/** Builds a tel: href. Standard US numbers get a clean E.164 value (tel:+16094406809); anything else keeps its original digits/plus-prefix rather than assuming a country code. Returns null only when there's nothing dialable at all. */
export function phoneTelHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const tenDigits = extractUsTenDigits(trimmed);
  if (tenDigits) return `tel:+1${tenDigits}`;

  const digits = trimmed.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

/**
 * Formats a phone number as the user types, for the shared PhoneInput
 * component (components/PhoneInput.tsx) - progressively adds dashes
 * once there are enough digits, same "609-440-6809" shape. Caps at 10
 * digits; anything typed beyond that is ignored rather than producing
 * a malformed international-looking string, since this is only used
 * for the standard US lead-capture forms.
 */
export function formatPhoneAsYouType(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}
