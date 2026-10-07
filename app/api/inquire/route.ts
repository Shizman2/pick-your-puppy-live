import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { normalizePhone, normalizeEmail } from "../../../lib/normalize";
import { saveInquiryCore } from "../../../lib/inquiryCoreWrite";
import { attachClickAttributionToContact, AFFILIATE_CLICK_COOKIE } from "../../../lib/affiliateAttribution";
import { linkFavoritesToContact } from "../../../lib/favorites";
import { calculateScoreBump, clampScore } from "../../../lib/leadScore";
import { sendPushToAdmins, sanitizeForNotification } from "../../../lib/push";
import type { NotificationEventType } from "../../../lib/pushTypes";
import { syncInquiryToGHL } from "../../../lib/ghl";
import { recordAnalyticsEvent } from "../../../lib/analytics/ingest";
import { ANALYTICS_VISITOR_COOKIE, ANALYTICS_SESSION_COOKIE } from "../../../lib/analytics/constants";

export const dynamic = "force-dynamic";

/** Shown to the customer whenever their submission was NOT saved - never a database/internal error. */
const INQUIRY_FAILED_MESSAGE = "We couldn't send your message. Please try again.";

const VALID_TYPES = ["puppy_interest", "puppy_finder", "pypl", "general", "puppy_reservation"];

/**
 * Best-effort in-memory rate limiter: max 5 submissions per IP per
 * 10 minutes. Flagging a real limitation here rather than pretending
 * this is robust - this app runs on Netlify's serverless functions,
 * where each instance can be short-lived or run cold, so this map
 * does not reliably persist across every request. It stops naive,
 * rapid-fire spam from a single warm instance, but a determined
 * abuser could get around it. A database-backed limiter would be
 * more reliable if this becomes a real problem - not built now, to
 * avoid adding new tables beyond what was just approved.
 */
const submissionLog = new Map<string, number[]>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (submissionLog.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  timestamps.push(now);
  submissionLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

/**
 * Maps a saved inquiry to the admin push notification it should trigger,
 * if any. Returns null for inquiry types Phase 1 doesn't push for (pypl).
 * Notification bodies intentionally carry only a first name and
 * puppy/request context - no email, phone, or other customer detail.
 */
function buildAdminNotification(
  inquiryType: string,
  body: Record<string, unknown>,
  firstName: string,
  contactId: string
): { eventType: NotificationEventType; payload: { title: string; body: string; url: string; tag: string } } | null {
  const url = `/admin/contacts/${contactId}`;
  const name = sanitizeForNotification(firstName, 40) || "Someone";

  if (inquiryType === "puppy_reservation") {
    const puppyName = sanitizeForNotification(body.puppyName as string, 40) || "a puppy";
    return {
      eventType: "reservation_request",
      payload: { title: "New Reservation Request", body: `${name} wants ${puppyName}.`, url, tag: "reservation_request" },
    };
  }

  if (inquiryType === "puppy_finder") {
    const breed = sanitizeForNotification(body.breed as string, 30);
    const gender = sanitizeForNotification(body.genderPreference as string, 20);
    const looking = [gender, breed].filter(Boolean).join(" ") || "a puppy";
    return {
      eventType: "puppy_finder_request",
      payload: {
        title: "New Puppy Finder Request",
        body: `${name} is looking for ${looking}.`,
        url,
        tag: "puppy_finder_request",
      },
    };
  }

  if (inquiryType === "general") {
    return {
      eventType: "contact_message",
      payload: { title: "New Contact Message", body: `New message from ${name}.`, url, tag: "contact_message" },
    };
  }

  if (inquiryType === "puppy_interest") {
    const puppyName = sanitizeForNotification(body.puppyName as string, 40) || "a puppy";
    return {
      eventType: "puppy_inquiry",
      payload: { title: "New Puppy Inquiry", body: `${name} asked about ${puppyName}.`, url, tag: "puppy_inquiry" },
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many submissions, please try again later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field. Bots that
  // auto-fill every input often do. Reject silently with a normal-
  // looking success response so bots don't learn to avoid it.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ success: true });
  }

  const inquiryType = String(body.inquiryType || "");
  if (!VALID_TYPES.includes(inquiryType)) {
    return NextResponse.json({ error: "Invalid inquiry type" }, { status: 400 });
  }

  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const city = String(body.city || "").trim();
  const state = String(body.state || "").trim();
  const preferredContactMethod = String(body.preferredContactMethod || "").trim();
  const consentToContact = Boolean(body.consentToContact);
  const notes = String(body.notes || "").trim();
  // A2P SMS consent - deliberately separate from consentToContact above
  // and from each other. Each defaults to false when the submitting
  // form doesn't send it at all (every inquiry type except
  // puppy_interest today), never inferred from a phone number being
  // present.
  const smsInquiryConsent = Boolean(body.smsInquiryConsent);
  const smsMarketingConsent = Boolean(body.smsMarketingConsent);
  const consentVersion = typeof body.consentVersion === "string" ? body.consentVersion : null;

  if (!firstName || (!phone && !email)) {
    return NextResponse.json(
      { error: "First name and at least one of phone or email are required." },
      { status: 400 }
    );
  }

  if (!consentToContact) {
    return NextResponse.json(
      { error: "Consent to contact is required before we can save this inquiry." },
      { status: 400 }
    );
  }

  const phoneNormalized = normalizePhone(phone);
  const emailNormalized = normalizeEmail(email);

  const admin = createAdminClient();

  // Capture the CURRENT analytics visitor/session (if any), straight
  // from the httpOnly pp_av/pp_as cookies the browser is already sending
  // on this request - never trusted from a client-supplied field, since
  // none is ever exposed in the form. Both are simply null if the
  // visitor has no analytics cookies yet (e.g. excluded device, blocked
  // cookies, or an ad-blocker) - the inquiry still saves normally either
  // way. No foreign key to analytics_visitors/analytics_sessions on
  // these columns (see supabase/029_inquiry_analytics_attribution.sql
  // for why), so a stale or absent value can never break this insert.
  const analyticsVisitorId = request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value || null;
  const analyticsSessionId = request.cookies.get(ANALYTICS_SESSION_COOKIE)?.value || null;

  // 1. Build type-specific promoted columns + full form_data snapshot.
  // sms_inquiry_consent/sms_marketing_consent/consent_version are
  // promoted for every inquiry type, not just puppy_interest - the
  // inquiries row itself (via its own created_at) is what timestamps
  // the consent decision, so there's no separate column for that.
  const inquiryColumns: Record<string, unknown> = {
    inquiry_type: inquiryType,
    form_data: body,
    sms_inquiry_consent: smsInquiryConsent,
    sms_marketing_consent: smsMarketingConsent,
    consent_version: consentVersion,
    analytics_visitor_id: analyticsVisitorId,
    analytics_session_id: analyticsSessionId,
  };

  let interestLabel = "";
  let eventSlug: string | null = null;

  if (inquiryType === "puppy_interest") {
    inquiryColumns.puppy_name = body.puppyName || null;
    inquiryColumns.puppy_slug = body.puppySlug || null;
    inquiryColumns.source_url = body.sourceUrl || null;
    inquiryColumns.ready_for_deposit = body.readyForDeposit || null;
    interestLabel = `Interested in ${body.puppyName || "a puppy"}`;
  } else if (inquiryType === "puppy_finder") {
    inquiryColumns.breed = body.breed || null;
    inquiryColumns.gender_preference = body.genderPreference || null;
    // The current form sends a budget RANGE string (e.g. "1500-2000"),
    // not a yes/no confirmation of a fixed floor - map it to real
    // min/max numbers. "flexible" (and anything unrecognized) falls
    // through to null/null, same as "no preference".
    const budgetRangeMap: Record<string, [number, number | null]> = {
      "1250-1500": [1250, 1500],
      "1500-2000": [1500, 2000],
      "2000+": [2000, null],
    };
    const budgetRange = budgetRangeMap[body.budgetRange as string];
    inquiryColumns.budget_min = budgetRange ? budgetRange[0] : null;
    inquiryColumns.budget_max = budgetRange ? budgetRange[1] : null;
    inquiryColumns.timeframe = body.timeframe || null;
    // The form sends this as "yes" / "no" / "not_sure", not a boolean.
    inquiryColumns.delivery_needed =
      body.deliveryNeeded === "yes" ? true : body.deliveryNeeded === "no" ? false : null;
    interestLabel = `Puppy Finder: ${body.breed || "any breed"}`;
  } else if (inquiryType === "pypl") {
    // Look up the current event, if any, so PYPL registrations link
    // to the real event rather than storing plain text.
    const { data: event } = await admin.from("events").select("*").limit(1).maybeSingle();
    if (event) {
      inquiryColumns.event_id = event.id;
      inquiryColumns.event_title_snapshot = event.event_title || event.countdown_headline;
      inquiryColumns.event_show_at_snapshot = event.show_at;
      eventSlug = event.status === "published" ? event.slug : null;
    }
    interestLabel = "Registered for Pick Your Puppy Live";
  } else if (inquiryType === "general") {
    inquiryColumns.subject = body.subject || null;
    interestLabel = String(body.subject || "General question");
  } else if (inquiryType === "puppy_reservation") {
    inquiryColumns.puppy_id = body.puppyId || null;
    inquiryColumns.puppy_name = body.puppyName || null;
    inquiryColumns.puppy_slug = body.puppySlug || null;
    inquiryColumns.source_url = body.sourceUrl || null;
    inquiryColumns.pickup_or_delivery = body.pickupOrDelivery || null;
    interestLabel = `Reservation request: ${body.puppyName || "a puppy"}`;
  }

  const interestType =
    inquiryType === "puppy_interest"
      ? "puppy"
      : inquiryType === "puppy_reservation"
      ? "reservation"
      : inquiryType === "puppy_finder"
      ? "breed"
      : inquiryType === "pypl"
      ? "pypl"
      : "general";

  const messageBody =
    notes || interestLabel || `New ${inquiryType.replace("_", " ")} inquiry submitted.`;

  // 2. The core write - contact (matched, created, or restored from
  // archived), inquiry, interest, conversation, inbound message and
  // needs_reply - as ONE transaction (see lib/inquiryCoreWrite.ts). If
  // it fails, nothing was saved: tell the customer plainly so they can
  // resend, and keep the real error in the server log only.
  const core = await saveInquiryCore({
    firstName,
    lastName,
    phone,
    phoneNormalized,
    email,
    emailNormalized,
    city,
    state,
    preferredContactMethod,
    consentToContact,
    source: "website_inquire_form",
    inquiryColumns,
    interestType,
    interestLabel,
    messageBody,
  });

  if (!core.ok) {
    const err = core.error as { message?: string; code?: string } | null;
    console.error(
      `[inquire] core write failed at "${core.step}"${core.contactId ? ` for contact ${core.contactId}` : ""}:`,
      err instanceof Error ? err.message : err?.message ?? err,
      err?.code ? `(code ${err.code})` : ""
    );
    return NextResponse.json({ error: INQUIRY_FAILED_MESSAGE }, { status: 500 });
  }

  const { contact, isNew, flaggedDuplicate, inquiryId } = core;

  // Everything below is best-effort. The customer's inquiry is already
  // saved, so none of it may turn this into a failure response - a
  // problem here is logged, never shown to the customer.
  const bestEffort = async (label: string, work: () => Promise<unknown>) => {
    try {
      await work();
    } catch (err) {
      console.error(`[inquire] ${label} failed for contact ${contact.id}:`, err instanceof Error ? err.message : err);
    }
  };

  // 3. Attach affiliate attribution, if this visitor currently carries
  // a valid click cookie - re-validated live (click not expired, its
  // affiliate still approved), never just trusted from the cookie alone.
  const clickId = request.cookies.get(AFFILIATE_CLICK_COOKIE)?.value;
  if (clickId) {
    await bestEffort("affiliate attribution", () => attachClickAttributionToContact(contact.id, clickId));
  }

  // 4. Same moment: if this visitor has favorited anything anonymously,
  // link those rows to the now-identifiable Contact.
  await bestEffort("favorites linking", () => linkFavoritesToContact(contact.id));

  // 5. Timeline entry.
  const { error: timelineError } = await admin.from("timeline_events").insert({
    contact_id: contact.id,
    event_type: "form_submitted",
    metadata: { inquiry_type: inquiryType, inquiry_id: inquiryId },
    description: `Submitted ${inquiryType.replace("_", " ")} form`,
  });
  if (timelineError) {
    console.error(`[inquire] timeline insert failed for contact ${contact.id}:`, timelineError.message);
  }

  // 6. Lead score bump + contact activity timestamps.
  const scoreBump = calculateScoreBump({
    inquiryType: inquiryType as "puppy_interest" | "puppy_finder" | "pypl" | "general" | "puppy_reservation",
    readyForDeposit: (body.readyForDeposit as string) || null,
  });

  const now = new Date().toISOString();
  const { error: activityUpdateError } = await admin
    .from("contacts")
    .update({
      lead_score: clampScore((contact.lead_score || 0) + scoreBump),
      last_activity_at: now,
      updated_at: now,
    })
    .eq("id", contact.id);
  if (activityUpdateError) {
    console.error(`[inquire] lead score/activity update failed for contact ${contact.id}:`, activityUpdateError.message);
  }

  // 7. Admin push notification - alert layer only, never blocks or fails
  // this response. Every form funnels through this single route, so
  // this is the one place notifications are triggered (no risk of the
  // same submission firing more than one push).
  const notification = buildAdminNotification(inquiryType, body, firstName, contact.id);
  if (notification) {
    await bestEffort("admin push", () => sendPushToAdmins(notification.eventType, notification.payload));
  }

  // 8. Best-effort GHL sync - see lib/ghl.ts for why this exists
  // alongside External Tracking (which already handles page/contact
  // tracking correctly, but can't populate these two checkbox custom
  // fields). Never blocks or fails this response.
  await syncInquiryToGHL({
    firstName,
    email,
    phone,
    smsInquiryConsent,
    smsMarketingConsent,
  });

  // 9. Successful-submission conversion event - fired exactly once,
  // here, only after the inquiry row above has actually been saved.
  // Deliberately separate from the im_interested CTA click (which only
  // means the form was opened, not submitted - see PuppyQuestionForm.tsx).
  // Routed through the same recordAnalyticsEvent() used by every other
  // event type, so it automatically respects the same non-production/
  // device-exclusion rules. Best-effort: never blocks or fails this
  // response if analytics is unreachable or misconfigured.
  let analyticsResult: Awaited<ReturnType<typeof recordAnalyticsEvent>> | null = null;
  try {
    let eventPath = "/";
    if (typeof body.sourceUrl === "string") {
      try {
        eventPath = new URL(body.sourceUrl).pathname;
      } catch {
        // Keep the "/" fallback if sourceUrl isn't a parseable absolute URL.
      }
    }
    const puppyIdForEvent =
      (inquiryType === "puppy_interest" || inquiryType === "puppy_reservation") && typeof body.puppyId === "string"
        ? body.puppyId
        : null;

    analyticsResult = await recordAnalyticsEvent({
      eventType: "inquiry_submit",
      path: eventPath,
      puppyId: puppyIdForEvent,
    });
  } catch (err) {
    console.error("[inquire] failed to record inquiry_submit analytics event:", err instanceof Error ? err.message : err);
  }

  const response = NextResponse.json({
    success: true,
    isNewContact: isNew,
    flaggedDuplicate: Boolean(flaggedDuplicate),
    eventSlug,
  });

  // If recordAnalyticsEvent minted a brand-new visitor/session (only
  // happens when this request carried no prior pp_av/pp_as cookies at
  // all), the browser needs to actually be told about it via Set-Cookie
  // here - otherwise this visitor/session would exist in the database
  // but the browser would never learn its id, and the next page load
  // would mint yet another one instead of continuing it. Mirrors the
  // exact cookie-setting logic in app/api/analytics/track/route.ts.
  if (analyticsResult?.visitorCookie) {
    response.cookies.set(ANALYTICS_VISITOR_COOKIE, analyticsResult.visitorCookie.value, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: analyticsResult.visitorCookie.maxAge,
      path: "/",
    });
  }
  if (analyticsResult?.sessionCookie) {
    response.cookies.set(ANALYTICS_SESSION_COOKIE, analyticsResult.sessionCookie.value, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: analyticsResult.sessionCookie.maxAge,
      path: "/",
    });
  }

  return response;
}
