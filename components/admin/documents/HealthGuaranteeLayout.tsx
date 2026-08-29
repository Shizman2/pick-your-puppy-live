"use client";

import type { BillOfSaleResolvedData, DocumentBlock, HealthGuaranteeTemplateContent } from "../../../lib/documentTypes";

interface HealthGuaranteeLayoutProps {
  content: HealthGuaranteeTemplateContent;
  data: BillOfSaleResolvedData;
}

/**
 * Layer 2 - the fixed, coded print layout for the Health Guarantee.
 * Reuses the same BillOfSaleResolvedData shape as the Bill of Sale
 * (same sale, same resolver in lib/documents.ts) - this document just
 * displays a subset of those fields. Same pure-component rules as
 * BillOfSaleLayout: no hooks/handlers, safe for renderToStaticMarkup.
 *
 * Deviation from the approved reference image, flagged for review: the
 * identifying block below the header (Buyer/Puppy/Breed/DOB/Sale Date/
 * Price) isn't in that reference, but was kept so a generated copy
 * actually shows which sale it belongs to - remove it if that's not
 * wanted.
 */
export default function HealthGuaranteeLayout({ content, data }: HealthGuaranteeLayoutProps) {
  const s = content.sections;

  return (
    <div className="hg-page">
      <div className="hg-header">
        <div className="hg-brand">{data.business_website}</div>
        <div className="hg-title">Health Guarantee</div>
      </div>

      <div className="hg-identity-row">
        <IdentityField label="Buyer" value={data.buyer_name} />
        <IdentityField label="Puppy" value={data.puppy_name} />
        <IdentityField label="Breed" value={data.puppy_breed} />
        <IdentityField label="Date of Birth" value={data.puppy_dob} />
        <IdentityField label="Date of Sale" value={data.sale_date} />
      </div>

      <Section heading={s.health_at_sale.heading} body={s.health_at_sale.body} />
      <Section heading={s.required_exam.heading} body={s.required_exam.body} />
      <Section heading={s.qualifying_conditions.heading} body={s.qualifying_conditions.body} />
      <Section heading={s.notification.heading} body={s.notification.body} />
      <Section heading={s.remedies.heading} body={s.remedies.body} />
      <Section heading={s.congenital.heading} body={s.congenital.body} />

      <div className="hg-columns">
        <Section heading={s.not_covered.heading} body={s.not_covered.body} compact />
        <Section heading={s.buyer_responsibilities.heading} body={s.buyer_responsibilities.body} compact />
      </div>

      <div className="hg-disclaimer">{content.disclaimer_text}</div>

      <div className="hg-acknowledgment">{content.acknowledgment_text}</div>

      <div className="hg-signatures">
        <div className="hg-signature-block">
          <div className="hg-signature-line" />
          <div className="hg-signature-caption">Buyer Signature &nbsp;&nbsp;&nbsp; Date ___________</div>
        </div>
        <div className="hg-signature-block">
          <div className="hg-signature-line hg-signature-line--seller">{data.seller_signature}</div>
          <div className="hg-signature-caption">Seller Signature &nbsp;&nbsp;&nbsp; Date ___________</div>
        </div>
      </div>

      <div className="hg-footer">{content.footer_text}</div>
    </div>
  );
}

function IdentityField({ label, value }: { label: string; value: string }) {
  return (
    <div className="hg-identity-field">
      <span className="hg-identity-label">{label}:</span> <span className="hg-identity-value">{value || " "}</span>
    </div>
  );
}

function Section({ heading, body, compact }: { heading: string; body: DocumentBlock[]; compact?: boolean }) {
  return (
    <div className={`hg-section${compact ? " hg-section--compact" : ""}`}>
      <div className="hg-section-title">{heading}</div>
      {body.map((block, i) =>
        block.type === "paragraph" ? (
          <p key={i} className="hg-paragraph">
            {block.text}
          </p>
        ) : (
          <ul key={i} className="hg-list">
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
