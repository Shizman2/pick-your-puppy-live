-- Puppy Documents: fourth native template, Puppy Purchase
-- Acknowledgement.
--
-- Reuses the exact same document_templates/document_template_versions/
-- generated_documents tables from 010_puppy_documents.sql - no schema
-- changes needed, just a new seeded template row. Safe to run more
-- than once (guarded with on conflict do nothing).
--
-- Section headings are stored WITHOUT their number prefix - unlike the
-- Health Guarantee/Refund Policy templates, PuppyPurchaseAcknowledgementLayout.tsx
-- adds the "N." prefix itself based on column position, since this
-- document's numbering follows its two-column placement (1-5 left,
-- 6-9 right) rather than being baked into the wording.

with new_template as (
  insert into document_templates (name, slug)
  values ('Puppy Purchase Acknowledgement', 'puppy-purchase-acknowledgement')
  on conflict (slug) do nothing
  returning id
)
insert into document_template_versions (template_id, version_number, content)
select
  id,
  1,
  '{
    "intro_text": "This acknowledgement confirms that the Buyer has received and reviewed the important information and documents related to the purchase of their puppy.",
    "sections": {
      "required_exam": {
        "heading": "Required Veterinary Examination",
        "body": [
          { "type": "paragraph", "text": "The Buyer understands that the puppy must be examined by a licensed veterinarian within the timeframe stated in the Health Guarantee in order to preserve any applicable health-guarantee rights." }
        ]
      },
      "veterinary_documentation": {
        "heading": "Veterinary Documentation",
        "body": [
          { "type": "paragraph", "text": "Any health-related claim must be supported by written documentation from a licensed veterinarian. The Buyer understands that verbal statements, observations at home, or an undocumented opinion do not by themselves establish eligibility for a refund, replacement, or reimbursement." }
        ]
      },
      "reservation_payment": {
        "heading": "Reservation Payment",
        "body": [
          { "type": "paragraph", "text": "If a reservation payment was made to hold the puppy, the Buyer understands that the reservation payment is non-refundable unless:" },
          { "type": "list", "items": ["The Puppy Plugs is unable to complete the transaction; or", "A refund is required under the Health Guarantee or applicable law."] },
          { "type": "paragraph", "text": "The Buyer understands that once a puppy is reserved, The Puppy Plugs will stop offering that puppy to other potential buyers." }
        ]
      },
      "no_returns_change_of_mind": {
        "heading": "No Returns for Change of Mind",
        "body": [
          { "type": "paragraph", "text": "The Buyer understands that a puppy may not be returned for reasons such as:" },
          { "type": "list", "items": ["Buyer''s remorse", "Family disagreement", "Housing or landlord issues", "Moving or relocation", "Financial changes", "Work or schedule changes", "Allergies", "The Buyer deciding they are no longer ready for a puppy"] },
          { "type": "paragraph", "text": "Any rights required by applicable law remain unaffected." }
        ]
      },
      "common_temporary_conditions": {
        "heading": "Common Temporary Puppy Conditions",
        "body": [
          { "type": "paragraph", "text": "The Buyer understands that young puppies may experience temporary health or adjustment issues when transitioning to a new home. These conditions do not automatically mean that the puppy was unfit for purchase." },
          { "type": "list", "items": ["Mild diarrhea or upset stomach", "Temporary loss of appetite", "Vomiting related to stress or food changes", "Sneezing or runny nose", "Mild skin irritation", "Fleas or ticks", "Worms or other parasites", "Ear mites", "Mild cold or kennel-cough symptoms", "Stress related to travel or a new environment"] },
          { "type": "paragraph", "text": "Any serious or continuing health concern should be evaluated by a licensed veterinarian." }
        ]
      },
      "travel_adjustment_stress": {
        "heading": "Travel & Adjustment Stress",
        "body": [
          { "type": "paragraph", "text": "The Buyer understands that travel, relocation, changes in food, and entering a new environment may temporarily affect the puppy''s appetite, digestion, energy level, sleep, or behavior." }
        ]
      },
      "vaccinations_ongoing_care": {
        "heading": "Vaccinations & Ongoing Care",
        "body": [
          { "type": "paragraph", "text": "The Buyer understands that puppy care continues after purchase. The Buyer is responsible for:" },
          { "type": "list", "items": ["Continuing age-appropriate vaccinations and boosters", "Routine veterinary care", "Deworming and parasite prevention", "Proper nutrition and hydration", "Safe housing and supervision", "Following veterinary recommendations"] }
        ]
      },
      "health_concerns": {
        "heading": "Health Concerns",
        "body": [
          { "type": "paragraph", "text": "If the Buyer believes the puppy may have a qualifying health issue, the Buyer agrees to:" },
          { "type": "list", "items": ["Have the puppy evaluated by a licensed veterinarian", "Obtain written veterinary documentation", "Notify The Puppy Plugs within the timeframe required by the Health Guarantee or applicable law"] },
          { "type": "paragraph", "text": "The Buyer understands that health-related refunds, replacements, or reimbursements are governed by the separate Health Guarantee and applicable law." }
        ]
      }
    },
    "documents_received_heading": "Documents Received",
    "documents_received_items": [
      "Puppy Purchase Record & Bill of Sale",
      "Health Guarantee",
      "Refund & Non-Refundable Payment Policy",
      "Vaccination Record"
    ],
    "acknowledgment_heading": "Buyer Acknowledgement",
    "acknowledgment_text": "By signing below, the Buyer confirms that they have received and reviewed the information above and understand their responsibilities after receiving the puppy.",
    "footer_text": "Thank you for choosing The Puppy Plugs!"
  }'::jsonb
from new_template;
