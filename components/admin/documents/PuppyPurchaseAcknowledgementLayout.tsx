"use client";

import type {
  BillOfSaleResolvedData,
  DocumentBlock,
  DocumentSection,
  PuppyPurchaseAcknowledgementTemplateContent,
} from "../../../lib/documentTypes";

interface PuppyPurchaseAcknowledgementLayoutProps {
  content: PuppyPurchaseAcknowledgementTemplateContent;
  data: BillOfSaleResolvedData;
}

/**
 * Layer 2 - the fixed, coded print layout. No brand/URL above the
 * title, by explicit instruction - the page starts directly with
 * "Puppy Purchase Acknowledgement". Two columns: 1-5 on the left, and
 * 6-9 plus the acknowledgment/signature block all in the right column
 * (not spanning full width) - matches the approved reference image
 * exactly, an intentionally asymmetric layout rather than a balanced
 * even split. Plain black-on-white, same as the other three documents.
 */
export default function PuppyPurchaseAcknowledgementLayout({
  content,
  data,
}: PuppyPurchaseAcknowledgementLayoutProps) {
  const s = content.sections;

  return (
    <div className="ppa-page">
      <div className="ppa-header">
        <div className="ppa-title">Puppy Purchase Acknowledgement</div>
        <p className="ppa-intro">{content.intro_text}</p>
      </div>

      <div className="ppa-columns">
        <div className="ppa-col">
          <Section number={1} {...s.required_exam} />
          <Section number={2} {...s.veterinary_documentation} />
          <Section number={3} {...s.reservation_payment} />
          <Section number={4} {...s.no_returns_change_of_mind} />
          <Section number={5} {...s.common_temporary_conditions} />
        </div>

        <div className="ppa-col">
          <Section number={6} {...s.travel_adjustment_stress} />
          <Section number={7} {...s.vaccinations_ongoing_care} />
          <Section number={8} {...s.health_concerns} />

          <div className="ppa-section">
            <div className="ppa-section-title">9. {content.documents_received_heading}</div>
            {content.documents_received_items.map((item, i) => (
              <div key={i} className="ppa-checkbox-row">
                <span className="ppa-checkbox">☐</span> {item}
              </div>
            ))}
          </div>

          <div className="ppa-acknowledgment">
            <div className="ppa-acknowledgment-heading">{content.acknowledgment_heading}</div>
            <p>{content.acknowledgment_text}</p>
          </div>

          <div className="ppa-signature-field">
            <span className="ppa-signature-label">Buyer Name:</span>
            <span className="ppa-signature-blank" />
          </div>
          <div className="ppa-signature-field">
            <span className="ppa-signature-label">Buyer Signature:</span>
            <span className="ppa-signature-blank" />
          </div>
          <div className="ppa-signature-field">
            <span className="ppa-signature-label">Date:</span>
            <span className="ppa-signature-blank" />
          </div>

          <div className="ppa-signature-field" style={{ marginTop: 10 }}>
            <span className="ppa-signature-label">Seller Signature:</span>
            <span className="ppa-signature-blank ppa-signature-blank--seller">{data.seller_signature}</span>
          </div>
          <div className="ppa-signature-field">
            <span className="ppa-signature-label">Date:</span>
            <span className="ppa-signature-blank" />
          </div>
        </div>
      </div>

      <div className="ppa-footer">{content.footer_text}</div>
    </div>
  );
}

function Section({ number, heading, body }: { number: number } & DocumentSection) {
  return (
    <div className="ppa-section">
      <div className="ppa-section-title">
        {number}. {heading}
      </div>
      {body.map((block, i) => renderBlock(block, i))}
    </div>
  );
}

function renderBlock(block: DocumentBlock, key: number) {
  if (block.type === "paragraph") {
    return (
      <p key={key} className="ppa-paragraph">
        {block.text}
      </p>
    );
  }
  return (
    <ul key={key} className="ppa-list">
      {block.items.map((item, j) => (
        <li key={j}>{item}</li>
      ))}
    </ul>
  );
}
