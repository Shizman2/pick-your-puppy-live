-- Atomic core write for website inquiry submissions (app/api/inquire/route.ts).
--
-- Before this, the route saved the contact, inquiry, interest,
-- conversation and inbound message as separate PostgREST calls - a
-- failure part-way (e.g. the message insert) left the earlier rows behind
-- while the customer was told their submission failed: a contact with no
-- inquiry, or an inquiry with no Message Center message. This function
-- does all of those writes in ONE transaction: a Postgres function runs
-- atomically, so any error inside it rolls back every write it made, and
-- a failed submission leaves nothing behind for a retry to duplicate.
--
-- Contact matching is unchanged from lib/duplicateMatch.ts
-- (findOrCreateContact): match on phone_normalized, then email_normalized;
-- if both match two DIFFERENT contacts, use the phone match and flag it
-- needs_duplicate_review; otherwise create a new contact. A matched
-- contact that was archived in the admin is un-archived here, inside the
-- same transaction, so a returning lead is never left hidden.
--
-- Deliberately NOT in here (stay best-effort in the route, after this
-- commits): affiliate attribution, favorites linking, timeline entry,
-- lead score / last_activity_at, admin push, GHL sync, analytics. None of
-- them may undo a customer inquiry that was actually received.
--
-- contacts.messages_cleared_at is never touched: a new message created
-- after a Message Center clear still reopens the conversation exactly as
-- before (see lib/messageCenter.ts).
--
-- Must be run manually in the Supabase SQL editor. Until it exists, the
-- route detects the missing function (PGRST202) and falls back to its
-- previous step-by-step writes, so deploying the code first never breaks
-- submissions.

create or replace function public.submit_website_inquiry(
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_phone_normalized text,
  p_email text,
  p_email_normalized text,
  p_city text,
  p_state text,
  p_preferred_contact_method text,
  p_consent_to_contact boolean,
  p_source text,
  p_inquiry jsonb,
  p_interest_type text,
  p_interest_label text,
  p_message_body text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_phone_match contacts%rowtype;
  v_email_match contacts%rowtype;
  v_contact contacts%rowtype;
  v_is_new boolean := false;
  v_flagged_duplicate boolean := false;
  v_inquiry_id uuid;
  v_conversation_id uuid;
  v_now timestamptz := now();
begin
  -- 1. Match or create the contact (same rules as findOrCreateContact).
  if p_phone_normalized is not null then
    select * into v_phone_match from contacts where phone_normalized = p_phone_normalized limit 1;
  end if;

  if p_email_normalized is not null then
    select * into v_email_match from contacts where email_normalized = p_email_normalized limit 1;
  end if;

  if v_phone_match.id is not null and v_email_match.id is not null and v_phone_match.id = v_email_match.id then
    v_contact := v_phone_match;
  elsif v_phone_match.id is not null and v_email_match.id is not null then
    update contacts set needs_duplicate_review = true where id = v_phone_match.id
      returning * into v_contact;
    v_flagged_duplicate := true;
  elsif v_phone_match.id is not null then
    v_contact := v_phone_match;
  elsif v_email_match.id is not null then
    v_contact := v_email_match;
  else
    insert into contacts (
      first_name, last_name, display_name,
      phone, phone_normalized, email, email_normalized,
      city, state, preferred_contact_method, consent_to_contact, source
    ) values (
      p_first_name,
      nullif(p_last_name, ''),
      trim(p_first_name || ' ' || coalesce(p_last_name, '')),
      nullif(p_phone, ''),
      p_phone_normalized,
      nullif(p_email, ''),
      p_email_normalized,
      nullif(p_city, ''),
      nullif(p_state, ''),
      nullif(p_preferred_contact_method, ''),
      p_consent_to_contact,
      p_source
    )
    returning * into v_contact;
    v_is_new := true;
  end if;

  -- 1a. A returning lead who was archived comes back to active.
  if v_contact.is_archived then
    update contacts set is_archived = false, updated_at = v_now where id = v_contact.id
      returning * into v_contact;
  end if;

  -- 2. The inquiry. p_inquiry carries the route's type-specific columns;
  -- jsonb_populate_record casts each value to its real column type.
  insert into inquiries (
    contact_id, inquiry_type, form_data,
    sms_inquiry_consent, sms_marketing_consent, consent_version,
    analytics_visitor_id, analytics_session_id,
    puppy_name, puppy_slug, source_url, ready_for_deposit,
    breed, gender_preference, budget_min, budget_max, timeframe, delivery_needed,
    event_id, event_title_snapshot, event_show_at_snapshot,
    subject, puppy_id, pickup_or_delivery
  )
  select
    v_contact.id, r.inquiry_type, r.form_data,
    coalesce(r.sms_inquiry_consent, false), coalesce(r.sms_marketing_consent, false), r.consent_version,
    r.analytics_visitor_id, r.analytics_session_id,
    r.puppy_name, r.puppy_slug, r.source_url, r.ready_for_deposit,
    r.breed, r.gender_preference, r.budget_min, r.budget_max, r.timeframe, r.delivery_needed,
    r.event_id, r.event_title_snapshot, r.event_show_at_snapshot,
    r.subject, r.puppy_id, r.pickup_or_delivery
  from jsonb_populate_record(null::inquiries, p_inquiry) as r
  returning id into v_inquiry_id;

  -- 3. The interest row for this inquiry.
  insert into interests (contact_id, inquiry_id, interest_type, label)
  values (v_contact.id, v_inquiry_id, p_interest_type, p_interest_label);

  -- 4. This contact's general conversation, the inbound message, and
  -- the needs_reply state.
  select id into v_conversation_id
  from conversations
  where contact_id = v_contact.id and conversation_type = 'general'
  limit 1;

  if v_conversation_id is null then
    insert into conversations (contact_id, conversation_type)
    values (v_contact.id, 'general')
    returning id into v_conversation_id;
  end if;

  insert into messages (conversation_id, contact_id, direction, sent_by, channel, body, status, is_read)
  values (v_conversation_id, v_contact.id, 'inbound', 'customer', 'website_form', p_message_body, 'logged', false);

  update conversations
  set status = 'needs_reply', last_message_at = v_now
  where id = v_conversation_id;

  return jsonb_build_object(
    'contact', to_jsonb(v_contact),
    'is_new', v_is_new,
    'flagged_duplicate', v_flagged_duplicate,
    'inquiry_id', v_inquiry_id,
    'conversation_id', v_conversation_id
  );
end;
$$;

-- Server-only: called by the route with the secret (service role) key.
-- Never callable directly by site visitors through the public API.
revoke all on function public.submit_website_inquiry(
  text, text, text, text, text, text, text, text, text, boolean, text, jsonb, text, text, text
) from public, anon, authenticated;

grant execute on function public.submit_website_inquiry(
  text, text, text, text, text, text, text, text, text, boolean, text, jsonb, text, text, text
) to service_role;

-- Make the new function visible to the API immediately.
notify pgrst, 'reload schema';
