/**
 * Normalizes a phone number down to its last 10 digits for matching
 * purposes (strips formatting, country code prefix, etc). Returns
 * null if there aren't enough digits to be a real phone number.
 */
export function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

/**
 * Normalizes an email to lowercase/trimmed for matching purposes.
 */
export function normalizeEmail(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed || null;
}
