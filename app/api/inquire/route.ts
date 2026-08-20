import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { normalizePhone, normalizeEmail } from "../../../lib/normalize";
import { findOrCreateContact } from "../../../lib/duplicateMatch";
import { calculateScoreBump, clampScore } from "../../../lib/leadScore";
import { sendPushToAdmins, sanitizeForNotification } from "../../../lib/push";
import type { NotificationEventType } from "../../../lib/pushTypes";

export const dynamic = "force-dynamic";

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

  // 1. Find or create the contact.
  const { contact, isNew, flaggedDuplicate } = await findOrCreateContact({
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
  });

  // 2. Build type-specific promoted columns + full form_data snapshot.
  const inquiryColumns: Record<string, unknown> = {
    contact_id: contact.id,
    inquiry_type: inquiryType,
    form_data: body,
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

  const { data: inquiry, error: inquiryError } = await admin
    .from("inquiries")
    .insert(inquiryColumns)
    .select()
    .single();

  if (inquiryError) {
    return NextResponse.json({ error: "Could not save inquiry" }, { status: 500 });
  }

  // 3. Record the interest.
  await admin.from("interests").insert({
    contact_id: contact.id,
    inquiry_id: inquiry.id,
    interest_type:
      inquiryType === "puppy_interest"
        ? "puppy"
        : inquiryType === "puppy_reservation"
        ? "reservation"
        : inquiryType === "puppy_finder"
        ? "breed"
        : inquiryType === "pypl"
        ? "pypl"
        : "general",
    label: interestLabel,
  });

  // 4. Find or create this contact's general conversation, then log
  // the submission as the first inbound message.
  let { data: conversation } = await admin
    .from("conversations")
    .select("*")
    .eq("contact_id", contact.id)
    .eq("conversation_type", "general")
    .limit(1)
    .maybeSingle();

  if (!conversation) {
    const { data: newConversation } = await admin
      .from("conversations")
      .insert({ contact_id: contact.id, conversation_type: "general" })
      .select()
      .single();
    conversation = newConversation;
  }

  const messageBody =
    notes || interestLabel || `New ${inquiryType.replace("_", " ")} inquiry submitted.`;

  await admin.from("messages").insert({
    conversation_id: conversation!.id,
    contact_id: contact.id,
    direction: "inbound",
    sent_by: "customer",
    channel: "website_form",
    body: messageBody,
    status: "logged",
    is_read: false,
  });

  await admin
    .from("conversations")
    .update({ status: "needs_reply", last_message_at: new Date().toISOString() })
    .eq("id", conversation!.id);

  // 5. Timeline entry.
  await admin.from("timeline_events").insert({
    contact_id: contact.id,
    event_type: "form_submitted",
    metadata: { inquiry_type: inquiryType, inquiry_id: inquiry.id },
    description: `Submitted ${inquiryType.replace("_", " ")} form`,
  });

  // 6. Lead score bump + contact activity timestamps.
  const scoreBump = calculateScoreBump({
    inquiryType: inquiryType as "puppy_interest" | "puppy_finder" | "pypl" | "general" | "puppy_reservation",
    readyForDeposit: (body.readyForDeposit as string) || null,
  });

  const now = new Date().toISOString();
  await admin
    .from("contacts")
    .update({
      lead_score: clampScore((contact.lead_score || 0) + scoreBump),
      last_activity_at: now,
      updated_at: now,
    })
    .eq("id", contact.id);

  // 7. Admin push notification - alert layer only, never blocks or fails
  // this response. Every form funnels through this single route, so
  // this is the one place notifications are triggered (no risk of the
  // same submission firing more than one push).
  const notification = buildAdminNotification(inquiryType, body, firstName, contact.id);
  if (notification) {
    await sendPushToAdmins(notification.eventType, notification.payload);
  }

  return NextResponse.json({
    success: true,
    isNewContact: isNew,
    flaggedDuplicate: Boolean(flaggedDuplicate),
    eventSlug,
  });
}
