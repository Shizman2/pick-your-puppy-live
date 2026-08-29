-- Puppy Documents: third native template, Refund & Non-Refundable
-- Payment Policy.
--
-- Reuses the exact same document_templates/document_template_versions/
-- generated_documents tables from 010_puppy_documents.sql - no schema
-- changes needed, just a new seeded template row. Safe to run more
-- than once (guarded with on conflict do nothing).
--
-- Pure static policy wording - no buyer/sale merge fields anywhere in
-- this document, per explicit instruction (no identifying block).

with new_template as (
  insert into document_templates (name, slug)
  values ('Refund & Non-Refundable Payment Policy', 'refund-policy')
  on conflict (slug) do nothing
  returning id
)
insert into document_template_versions (template_id, version_number, content)
select
  id,
  1,
  '{
    "intro_text": "This policy explains when payments may be refundable and when they are non-refundable. Any health-related refund or reimbursement is subject to the separate Health Guarantee and any rights required by applicable law.",
    "sections": {
      "reservation_payments": {
        "heading": "1. Reservation Payments",
        "body": [
          { "type": "paragraph", "text": "Any payment made to reserve or hold a puppy is non-refundable unless:" },
          { "type": "list", "items": ["The Puppy Plugs is unable to complete the transaction for some reason; or", "A refund is required under the Health Guarantee or applicable law."] },
          { "type": "paragraph", "text": "Once a puppy is reserved, The Puppy Plugs will stop offering that puppy to other potential buyers." }
        ]
      },
      "change_of_mind": {
        "heading": "2. Change of Mind",
        "body": [
          { "type": "paragraph", "text": "No refund will be issued because the Buyer changes their mind after reserving or purchasing a puppy. This includes, but is not limited to:" },
          { "type": "list", "items": ["Buyer''s remorse", "Family disagreement", "Housing or landlord restrictions", "Moving or relocation", "Financial changes", "Work or schedule changes", "The Buyer deciding they are no longer ready for a puppy"] }
        ]
      },
      "allergies": {
        "heading": "3. Allergies",
        "body": [
          { "type": "paragraph", "text": "Allergies involving the Buyer, a family member, or another person in the household do not qualify for a refund unless otherwise required by law." },
          { "type": "paragraph", "text": "The Buyer is responsible for determining whether a puppy is appropriate for their household before completing the purchase." }
        ]
      },
      "care_and_lifestyle": {
        "heading": "4. Care and Lifestyle Issues",
        "body": [
          { "type": "paragraph", "text": "A refund will not be issued because the Buyer is unable or unwilling to continue caring for the puppy after purchase. This includes issues involving:" },
          { "type": "list", "items": ["Training", "Potty training", "Barking", "Chewing", "Energy level", "Adjustment to the new home", "Compatibility with children or other pets", "Grooming or routine care requirements"] }
        ]
      },
      "common_temporary_conditions": {
        "heading": "5. Common Temporary Puppy Conditions",
        "body": [
          { "type": "paragraph", "text": "Young puppies may experience temporary conditions while adjusting to a new home, travel, diet changes, stress, or a new environment. These conditions do not automatically qualify the puppy for a refund. Examples may include:" },
          { "type": "list", "items": ["Mild diarrhea or upset stomach", "Temporary loss of appetite", "Vomiting associated with stress or food changes", "Sneezing or runny nose", "Mild skin irritation", "Fleas, ticks, worms, or other parasites", "Ear mites", "Mild cold or kennel-cough symptoms", "Stress related to travel or relocation"] },
          { "type": "paragraph", "text": "Any serious or continuing health concern should be evaluated by a licensed veterinarian." }
        ]
      },
      "health_related_refunds": {
        "heading": "6. Health-Related Refunds or Reimbursements",
        "body": [
          { "type": "paragraph", "text": "The Puppy Plugs does not provide refunds for health concerns based solely on the Buyer''s opinion, symptoms observed at home, or a verbal veterinary opinion." },
          { "type": "paragraph", "text": "A health-related refund will only be considered when a licensed veterinarian determines in writing that the puppy is unfit for purchase due to a qualifying illness, defect, or condition as provided under the applicable Puppy Lemon Law or other applicable law." },
          { "type": "paragraph", "text": "The Buyer must comply with all veterinary examination, notification, certification, and documentation requirements stated in the Health Guarantee and required by applicable law." },
          { "type": "paragraph", "text": "A veterinarian''s written certification must identify the qualifying illness, defect, or condition and satisfy the requirements necessary to establish that the puppy was unfit for purchase." },
          { "type": "paragraph", "text": "Nothing in this section limits any remedy that must be provided under applicable law." }
        ]
      },
      "disclosed_conditions": {
        "heading": "7. Disclosed Conditions",
        "body": [
          { "type": "paragraph", "text": "No refund will be provided for a condition that was disclosed to the Buyer in writing before or at the time of sale, except where otherwise required by law." }
        ]
      },
      "buyer_responsibility": {
        "heading": "8. Buyer Responsibility",
        "body": [
          { "type": "paragraph", "text": "The Buyer is responsible for providing proper care after receiving the puppy, including:" },
          { "type": "list", "items": ["Appropriate food and clean water", "Safe housing", "Veterinary care", "Vaccinations and boosters", "Deworming and parasite prevention", "Proper supervision", "Following veterinary recommendations"] },
          { "type": "paragraph", "text": "Conditions caused or worsened by neglect, improper care, injury after transfer, or failure to follow veterinary instructions do not qualify for a refund under this policy unless otherwise required by law." }
        ]
      },
      "applicable_law": {
        "heading": "9. Applicable Law",
        "body": [
          { "type": "paragraph", "text": "Nothing in this policy is intended to remove or limit any rights or remedies that cannot legally be waived under applicable state or federal law." },
          { "type": "paragraph", "text": "If this policy conflicts with a right provided by applicable law, the applicable law controls." }
        ]
      }
    },
    "acknowledgment_heading": "Buyer Acknowledgment",
    "acknowledgment_text": "By signing below, the Buyer acknowledges that they have received, read, and understand this Refund & Non-Refundable Payment Policy.",
    "footer_text": "Thank you for choosing ThePuppyPlugs.com!"
  }'::jsonb
from new_template;
