export type GeneratedDocumentStatus = "draft" | "finalized";

export interface DocumentTemplateRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplateVersionRow {
  id: string;
  template_id: string;
  version_number: number;
  content:
    | BillOfSaleTemplateContent
    | HealthGuaranteeTemplateContent
    | RefundPolicyTemplateContent
    | PuppyPurchaseAcknowledgementTemplateContent;
  created_at: string;
}

/** A Layer-1 wording block - just enough structure for longer-form documents (Health Guarantee) without becoming unrestricted HTML. */
export type DocumentBlock = { type: "paragraph"; text: string } | { type: "list"; items: string[] };

export interface DocumentSection {
  heading: string;
  body: DocumentBlock[];
}

/** Layer 1 only - editable wording. Physical layout (including the 7/8 two-column pairing) is coded in HealthGuaranteeLayout.tsx, never here. */
export interface HealthGuaranteeTemplateContent {
  sections: {
    health_at_sale: DocumentSection;
    required_exam: DocumentSection;
    qualifying_conditions: DocumentSection;
    notification: DocumentSection;
    remedies: DocumentSection;
    congenital: DocumentSection;
    not_covered: DocumentSection;
    buyer_responsibilities: DocumentSection;
  };
  disclaimer_text: string;
  acknowledgment_text: string;
  footer_text: string;
}

/** Layer 1 only - editable wording. Physical layout (the two-column 1-5/6-9 split) is coded in RefundPolicyLayout.tsx, never here. Pure static policy wording - no merge fields, no identifying block, per explicit instruction. */
export interface RefundPolicyTemplateContent {
  intro_text: string;
  sections: {
    reservation_payments: DocumentSection;
    change_of_mind: DocumentSection;
    allergies: DocumentSection;
    care_and_lifestyle: DocumentSection;
    common_temporary_conditions: DocumentSection;
    health_related_refunds: DocumentSection;
    disclosed_conditions: DocumentSection;
    buyer_responsibility: DocumentSection;
    applicable_law: DocumentSection;
  };
  acknowledgment_heading: string;
  acknowledgment_text: string;
  footer_text: string;
}

/** Layer 1 only - editable wording. Physical layout (the two-column 1-9 split, no branding above the title) is coded in PuppyPurchaseAcknowledgementLayout.tsx, never here. */
export interface PuppyPurchaseAcknowledgementTemplateContent {
  intro_text: string;
  sections: {
    required_exam: DocumentSection;
    veterinary_documentation: DocumentSection;
    reservation_payment: DocumentSection;
    no_returns_change_of_mind: DocumentSection;
    common_temporary_conditions: DocumentSection;
    travel_adjustment_stress: DocumentSection;
    vaccinations_ongoing_care: DocumentSection;
    health_concerns: DocumentSection;
  };
  documents_received_heading: string;
  documents_received_items: string[];
  acknowledgment_heading: string;
  acknowledgment_text: string;
  footer_text: string;
}

/** Layer 1 only - editable wording. Physical layout is coded in BillOfSaleLayout.tsx, never here. */
export interface BillOfSaleTemplateContent {
  intro_text: string;
  sections: {
    seller_information: { heading: string };
    buyer_information: { heading: string };
    puppy_information: { heading: string };
    purchase_information: { heading: string };
    puppy_photo: { heading: string };
    vaccination_record: { heading: string };
    signatures: { heading: string };
  };
  vaccination_complete_label: string;
  footer_text: string;
}

/**
 * Every merge-field value the Bill of Sale needs, resolved from real
 * Contact/Puppy/Sale/Payment data at generation time and frozen into
 * generated_documents.resolved_data. A missing value is an empty
 * string - the layout renders blank, never the literal field name.
 */
export interface BillOfSaleResolvedData {
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  buyer_address: string;
  buyer_city: string;
  buyer_state: string;
  buyer_zip: string;

  puppy_name: string;
  puppy_breed: string;
  puppy_sex: string;
  puppy_dob: string;
  puppy_color: string;
  puppy_registration: string;
  puppy_microchip: string;
  puppy_photo_url: string;

  sale_date: string;
  sale_price: string;

  reservation_amount: string;
  reservation_date: string;
  reservation_method: string;

  balance_amount: string;
  balance_date: string;
  balance_method: string;

  /** Not a merge field from CRM data - a manual per-document call, set via Edit This Copy. */
  vaccination_complete: "yes" | "no" | "";

  business_name: string;
  business_website: string;
  business_phone: string;
  business_email: string;

  /** Pre-filled Seller Signature text, reused across every document type - see getSellerSignatureName() in lib/content.ts. */
  seller_signature: string;
}

export interface GeneratedDocumentRow {
  id: string;
  template_id: string;
  template_version_id: string;
  contact_id: string | null;
  puppy_id: string | null;
  sale_id: string | null;
  resolved_data: BillOfSaleResolvedData;
  edited_content: BillOfSaleResolvedData | null;
  rendered_html: string | null;
  status: GeneratedDocumentStatus;
  generated_at: string;
  finalized_at: string | null;
  updated_at: string;
}
