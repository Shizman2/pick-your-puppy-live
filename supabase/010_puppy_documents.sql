-- Puppy Documents, Phase 1: Puppy Purchase Record & Bill of Sale.
--
-- Adds the handful of genuinely-missing Contact/Puppy fields the Bill
-- of Sale needs, plus the three-table document system (templates ->
-- template versions -> generated documents). Safe to run more than
-- once - every statement is guarded with `if not exists` / `on
-- conflict do nothing`.

-- ---------------------------------------------------------------------
-- Missing Contact/Puppy fields
-- ---------------------------------------------------------------------
alter table contacts add column if not exists address text;
alter table contacts add column if not exists zip text;

alter table puppies add column if not exists color text;
alter table puppies add column if not exists registration text;
alter table puppies add column if not exists microchip text;

-- ---------------------------------------------------------------------
-- document_templates - one row per document TYPE (Bill of Sale, and
-- later Health Guarantee, Refund Policy, etc). Shows up in the future
-- admin Documents list with Edit/Duplicate/Active-Inactive.
-- ---------------------------------------------------------------------
create table if not exists document_templates (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table document_templates enable row level security;

-- ---------------------------------------------------------------------
-- document_template_versions - one row per edit of a template's
-- WORDING only (Layer 1 - never layout). Immutable once created:
-- editing a template creates a new version instead of mutating an old
-- one, so a generated document that references an old version never
-- drifts when the wording changes later. "Current" version is simply
-- the highest version_number for a template - no current_version_id
-- column on document_templates, which would create a circular FK.
-- ---------------------------------------------------------------------
create table if not exists document_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references document_templates (id) on delete cascade,

  version_number integer not null,
  content jsonb not null,

  created_at timestamptz not null default now()
);

create unique index if not exists document_template_versions_template_version_idx
  on document_template_versions (template_id, version_number);

alter table document_template_versions enable row level security;

-- ---------------------------------------------------------------------
-- generated_documents - one row per document actually created for a
-- specific sale. Freezes the template version used + every resolved
-- merge-field value (resolved_data), so old finalized documents can
-- never change later. contact_id/puppy_id/sale_id all SET NULL on
-- delete - a finalized document is a historical record and must
-- survive even if the underlying contact/puppy/sale is later removed
-- (e.g. via the "Delete Everything Related" contact-cleanup flow);
-- resolved_data already has every value baked in, so nothing is lost.
--
-- rendered_html is only populated at finalization: a frozen snapshot
-- of the fully rendered markup (plus its own inlined stylesheet), so a
-- finalized document's appearance can never change even if
-- BillOfSaleLayout.tsx or its CSS are edited afterward. Produced via
-- React's renderToStaticMarkup - no Puppeteer, no headless browser, no
-- PDF generation.
-- ---------------------------------------------------------------------
create table if not exists generated_documents (
  id uuid primary key default gen_random_uuid(),

  template_id uuid not null references document_templates (id),
  template_version_id uuid not null references document_template_versions (id),

  contact_id uuid references contacts (id) on delete set null,
  puppy_id uuid references puppies (id) on delete set null,
  sale_id uuid references sales (id) on delete set null,

  resolved_data jsonb not null,
  edited_content jsonb,
  rendered_html text,

  status text not null default 'draft'
    check (status in ('draft', 'finalized')),

  generated_at timestamptz not null default now(),
  finalized_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists generated_documents_contact_id_idx on generated_documents (contact_id);
create index if not exists generated_documents_sale_id_idx on generated_documents (sale_id);
create index if not exists generated_documents_template_id_idx on generated_documents (template_id);

alter table generated_documents enable row level security;

-- ---------------------------------------------------------------------
-- Seed: the one template this phase actually builds. Wording only -
-- section order/columns/photo frame/sticker sizing all live in the
-- coded BillOfSaleLayout component, not here.
-- ---------------------------------------------------------------------
with new_template as (
  insert into document_templates (name, slug)
  values ('Puppy Purchase Record & Bill of Sale', 'bill-of-sale')
  on conflict (slug) do nothing
  returning id
)
insert into document_template_versions (template_id, version_number, content)
select
  id,
  1,
  '{
    "intro_text": "This document confirms the sale and transfer of the puppy described below from The Puppy Plugs to the Buyer. The Buyer acknowledges receipt of the puppy and the documents provided with the sale, including the applicable Health Guarantee and purchaser-protection information.",
    "sections": {
      "seller_information": { "heading": "Seller Information" },
      "buyer_information": { "heading": "Buyer Information" },
      "puppy_information": { "heading": "Puppy Information" },
      "purchase_information": { "heading": "Purchase Information" },
      "puppy_photo": { "heading": "Puppy Photo" },
      "vaccination_record": { "heading": "Vaccination Record" },
      "signatures": { "heading": "Signatures" }
    },
    "vaccination_complete_label": "Age-appropriate vaccinations complete:",
    "footer_text": "Thank you for choosing ThePuppyPlugs.com!"
  }'::jsonb
from new_template;
