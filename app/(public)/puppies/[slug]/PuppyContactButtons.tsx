"use client";

import { trackCta } from "../../../../lib/analytics/trackClient";
import { phoneE164 } from "../../../../lib/phone";
import type { PuppyGender } from "../../../../lib/puppyTypes";

// Text + Call buttons on the puppy detail page. Both go straight to the
// device (sms: / tel:) using the admin Seller Phone Number - no contact
// page in between. Tracking only records the tap, never that a text was
// actually sent or a call completed.

/** "Hi! I'm interested in MiMi the Toy Poodle. Is she still available?" - degrades cleanly without a name, breed or gender. */
export function buildTextMessage(name: string | null | undefined, breed: string | null | undefined, gender: PuppyGender | null | undefined) {
  const n = (name || "").trim();
  const b = (breed || "").trim();
  const subject = n && b ? `${n} the ${b}` : n || (b ? `this ${b}` : "this puppy");
  const pronoun = gender === "female" ? "she" : gender === "male" ? "he" : null;
  const question = pronoun ? `Is ${pronoun} still available?` : `Is ${n || "this puppy"} still available?`;
  return `Hi! I'm interested in ${subject}. ${question}`;
}

/** sms:+1XXXXXXXXXX?&body=... - the "?&" form opens prefilled on both iPhone and Android Messages. */
export function buildSmsHref(e164: string, message: string) {
  return `sms:${e164}?&body=${encodeURIComponent(message)}`;
}

export default function PuppyContactButtons({
  puppyId,
  name,
  breed,
  gender,
  phone,
}: {
  puppyId: string;
  name: string | null;
  breed: string;
  gender: PuppyGender | null;
  phone: string | null;
}) {
  const e164 = phoneE164(phone);
  // No configured (or no usable) Seller Phone Number: show nothing rather than a broken link.
  if (!e164) return null;

  const label = (name || "").trim() || breed;
  const smsHref = buildSmsHref(e164, buildTextMessage(name, breed, gender));

  return (
    <div className="detail-contact-btns">
      <a className="text-puppy-btn" href={smsHref} onClick={() => trackCta("text_us", puppyId)}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
          <path
            d="M12 3.5c-5.2 0-9.25 3.5-9.25 7.8 0 2.4 1.25 4.5 3.25 5.9l-.85 3.3 3.75-1.95c1 .3 2 .45 3.1.45 5.2 0 9.25-3.5 9.25-7.7S17.2 3.5 12 3.5z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
        Text About {label}
      </a>
      <a className="call-puppy-btn" href={`tel:${e164}`} onClick={() => trackCta("call_now", puppyId)}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
          <path
            d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1l-2 2z"
            fill="currentColor"
          />
        </svg>
        Call About {label}
      </a>
    </div>
  );
}
