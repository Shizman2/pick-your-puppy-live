-- Puppy Documents: second native template, Health Guarantee.
--
-- Reuses the exact same document_templates/document_template_versions/
-- generated_documents tables from 010_puppy_documents.sql - no schema
-- changes needed, just a new seeded template row. Safe to run more
-- than once (guarded with on conflict do nothing).
--
-- Wording sourced from the business's actual prior Health Guarantee
-- (10-day general-illness exam window, 30-day congenital/hereditary
-- window, 2-business-day notification, 5-day certification deadline,
-- refund/replacement/vet-fee-reimbursement remedies). Deliberately
-- state-agnostic - no Pennsylvania Dog Purchaser Protection Act
-- citations and no registration-document provisions here; both are
-- called out as handled separately in disclaimer_text, and are
-- expected to become their own document(s) later rather than being
-- folded into this one.

with new_template as (
  insert into document_templates (name, slug)
  values ('Health Guarantee', 'health-guarantee')
  on conflict (slug) do nothing
  returning id
)
insert into document_template_versions (template_id, version_number, content)
select
  id,
  1,
  '{
    "sections": {
      "health_at_sale": {
        "heading": "1. Health at Time of Sale",
        "body": [
          { "type": "paragraph", "text": "Seller certifies that this puppy is believed to be in good health at the time of sale, subject to the terms of this Health Guarantee." }
        ]
      },
      "required_exam": {
        "heading": "2. Required Veterinary Examination",
        "body": [
          { "type": "paragraph", "text": "To preserve rights under this Health Guarantee, Buyer must have the puppy examined by a licensed veterinarian within 10 days of purchase." }
        ]
      },
      "qualifying_conditions": {
        "heading": "3. Qualifying Health Conditions",
        "body": [
          { "type": "paragraph", "text": "If, within 10 days of purchase, a licensed veterinarian determines in writing that the puppy is clinically ill, or died from an injury sustained or an illness likely contracted on or before the date of sale or delivery, Buyer may qualify for the remedies described below." }
        ]
      },
      "notification": {
        "heading": "4. Buyer Notification Requirements",
        "body": [
          { "type": "paragraph", "text": "Within 2 business days of the veterinarian''s certification of illness, defect, or death, Buyer must notify Seller and provide the veterinarian''s name, address, and telephone number. Veterinary certification must be presented to Seller no later than 5 days after Buyer receives it." }
        ]
      },
      "remedies": {
        "heading": "5. Available Remedies",
        "body": [
          { "type": "list", "items": [
            "Return the puppy for a complete refund.",
            "Return the puppy for a replacement puppy of equal value.",
            "Retain the puppy and receive reimbursement for reasonable veterinary fees, not exceeding the purchase price."
          ] }
        ]
      },
      "congenital": {
        "heading": "6. Congenital / Hereditary Conditions",
        "body": [
          { "type": "paragraph", "text": "If, within 30 days of purchase, a licensed veterinarian determines in writing that the puppy has a congenital or hereditary defect that adversely affects its health, or that the puppy died from such a defect, the same remedies above apply." }
        ]
      },
      "not_covered": {
        "heading": "7. What Is Not Covered",
        "body": [
          { "type": "list", "items": [
            "Conditions disclosed in writing at the time of sale.",
            "Failure to obtain the required veterinary examination within 10 days.",
            "Failure to notify Seller or provide documentation within the required timeframes."
          ] }
        ]
      },
      "buyer_responsibilities": {
        "heading": "8. Buyer Responsibilities",
        "body": [
          { "type": "list", "items": [
            "Provide proper veterinary care and follow veterinary recommendations.",
            "Continue age-appropriate vaccinations and routine care.",
            "Maintain proper nutrition, hydration, and general care.",
            "Provide timely notice and documentation if making a claim."
          ] }
        ]
      }
    },
    "disclaimer_text": "State-specific purchaser-protection or registration disclosures may be provided separately if applicable.",
    "acknowledgment_text": "By signing below, Buyer acknowledges receipt of this Health Guarantee and confirms that the terms have been read and understood.",
    "footer_text": "Thank you for choosing ThePuppyPlugs.com!"
  }'::jsonb
from new_template;
