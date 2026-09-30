import "server-only";
import { normalizePhone } from "./normalize";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

// Field IDs + picklist option confirmed via a live diagnostic test
// against the Pick Your Puppy Live GHL location (both fields are
// CHECKBOX-type with a single defined option, "yes" - GHL normalizes
// this into value: ["yes"] on its side; the API itself accepts a
// plain string).
const CUSTOM_FIELD_PUPPY_INQUIRY_TEXTS = { id: "eOAm3rBkFk3xD9zU8aQw", key: "puppy_inquiry_texts" };
const CUSTOM_FIELD_OFFERS_PUPPY_UPDATES = { id: "v8YviYdBd8Zhbuv2KeGZ", key: "offers__puppy_updates" };

interface SyncInquiryToGHLInput {
  firstName: string;
  email?: string;
  phone?: string;
  smsInquiryConsent: boolean;
  smsMarketingConsent: boolean;
}

/**
 * US-only E.164 formatting for the GHL API specifically - matches what
 * was proven to work in the live diagnostic test. Returns null if the
 * number can't be reduced to 10 US digits (matches lib/normalize.ts's
 * own definition of "not enough digits to be a real phone number").
 */
function toE164UsPhone(raw: string | undefined): string | null {
  const tenDigits = normalizePhone(raw);
  return tenDigits ? `+1${tenDigits}` : null;
}

/**
 * Best-effort sync of a website puppy inquiry to GoHighLevel: upserts
 * the contact (matched/created by email or phone, same as GHL's own
 * External Tracking would) and sets only the SMS consent custom
 * fields the customer actually checked - never clearing or overwriting
 * a field for a consent that's merely absent from this submission.
 * External Tracking remains installed and unaffected; this exists
 * solely because External Tracking's own field-value mapping could
 * not populate these two checkbox custom fields (confirmed via direct
 * API testing), even though it correctly maps every other field.
 *
 * Never throws - a GHL outage or misconfiguration must never block
 * the customer's inquiry from saving in Supabase/Message Center.
 */
export async function syncInquiryToGHL(input: SyncInquiryToGHLInput): Promise<void> {
  const token = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!token || !locationId) {
    console.error("GHL sync skipped: GHL_PRIVATE_INTEGRATION_TOKEN or GHL_LOCATION_ID is not configured.");
    return;
  }

  const email = input.email?.trim() || undefined;
  const phone = toE164UsPhone(input.phone) || undefined;

  if (!email && !phone) {
    console.error("GHL sync skipped: no email or phone to identify the contact by.");
    return;
  }

  // Only affirmative consent is ever sent. A checkbox left unchecked
  // on THIS submission means "no new consent from this submission" -
  // it must never be sent as a value that could clear or overwrite a
  // previously recorded affirmative consent on the GHL contact.
  const customFields: Array<{ id: string; key: string; fieldValue: string }> = [];
  if (input.smsInquiryConsent) {
    customFields.push({ ...CUSTOM_FIELD_PUPPY_INQUIRY_TEXTS, fieldValue: "yes" });
  }
  if (input.smsMarketingConsent) {
    customFields.push({ ...CUSTOM_FIELD_OFFERS_PUPPY_UPDATES, fieldValue: "yes" });
  }

  try {
    const res = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Version: GHL_API_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        locationId,
        firstName: input.firstName,
        email,
        phone,
        ...(customFields.length > 0 ? { customFields } : {}),
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`GHL sync failed: HTTP ${res.status} ${text.slice(0, 300)}`);
    }
  } catch (err) {
    console.error("GHL sync failed:", err instanceof Error ? err.message : String(err));
  }
}
