-- A2P/SMS consent fields for the "I'm Interested" (PuppyQuestionForm)
-- submission flow. Added to `inquiries` (not `contacts`) deliberately:
-- a new inquiries row is already created per submission (see
-- app/api/inquire/route.ts), which gives each consent decision its own
-- immutable, timestamped record - inquiries.created_at IS the consent
-- timestamp, no separate column needed. Storing this only on `contacts`
-- would overwrite prior consent on repeat submissions and lose the
-- evidence trail entirely.
--
-- Mirrors this table's existing pattern of promoting type-specific
-- fields out of the raw form_data JSONB into dedicated, queryable
-- columns (see e.g. puppy_finder's budget_min/budget_max/timeframe) -
-- form_data already captures the full raw submission as a backup, this
-- just makes these two fields easy to query/audit directly.
--
-- Purely additive - every new column is nullable or defaults to false,
-- safe to run against the existing (populated) inquiries table without
-- touching any existing row's meaning.
alter table inquiries add column if not exists sms_inquiry_consent boolean not null default false;
alter table inquiries add column if not exists sms_marketing_consent boolean not null default false;

-- Which version of the consent disclosure language the customer saw
-- when they submitted - e.g. "a2p_consent_v1". Lets us know exactly
-- what they agreed to if the wording changes later. Null on older
-- inquiries submitted before this existed.
alter table inquiries add column if not exists consent_version text;
