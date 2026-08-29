"use client";

import type { BillOfSaleResolvedData, DocumentBlock, RefundPolicyTemplateContent } from "../../../lib/documentTypes";

interface RefundPolicyLayoutProps {
  content: RefundPolicyTemplateContent;
  data: BillOfSaleResolvedData;
}

/**
 * Layer 2 - the fixed, coded print layout. Pure static policy wording,
 * no per-sale merge fields and no identifying block by explicit
 * instruction - `data` is only used for the one reusable value every
 * document type shares (seller_signature), not buyer/puppy/sale
 * specifics. Two-column split (sections 1-5 left, 6-9 right) is what
 * fits this on one page - a coded layout decision, not something the
 * wording JSON controls. Matches the plain black-on-white style of the
 * other two documents on purpose - no color accents, no decorative
 * icons, no circle badges.
 */
export default function RefundPolicyLayout({ content, data }: RefundPolicyLayoutProps) {
  const s = content.sections;

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div className="rp-brand">ThePuppyPlugs.com</div>
        <div className="rp-title">Refund &amp; Non-Refundable Payment Policy</div>
        <p className="rp-intro">{content.intro_text}</p>
      </div>

      <div className="rp-columns">
        <div className="rp-col">
          <Section {...s.reservation_payments} />
          <Section {...s.change_of_mind} />
          <Section {...s.allergies} />
          <Section {...s.care_and_lifestyle} />
          <Section {...s.common_temporary_conditions} />
        </div>
        <div className="rp-col">
          <Section {...s.health_related_refunds} />
          <Section {...s.disclosed_conditions} />
          <Section {...s.buyer_responsibility} />
          <Section {...s.applicable_law} />
        </div>
      </div>

      <div className="rp-acknowledgment">
        <div className="rp-acknowledgment-heading">{content.acknowledgment_heading}</div>
        <p>{content.acknowledgment_text}</p>
      </div>

      <div className="rp-signatures">
        <div className="rp-signature-block">
          <div className="rp-signature-line" />
          <div className="rp-signature-caption">Buyer Signature &nbsp;&nbsp;&nbsp; Date ___________</div>
        </div>
        <div className="rp-signature-block">
          <div className="rp-signature-line rp-signature-line--seller">{data.seller_signature}</div>
          <div className="rp-signature-caption">Seller Signature &nbsp;&nbsp;&nbsp; Date ___________</div>
        </div>
      </div>

      <div className="rp-footer">{content.footer_text}</div>
    </div>
  );
}

function Section({ heading, body }: { heading: string; body: DocumentBlock[] }) {
  return (
    <div className="rp-section">
      <div className="rp-section-title">{heading}</div>
      {body.map((block, i) =>
        block.type === "paragraph" ? (
          <p key={i} className="rp-paragraph">
            {block.text}
          </p>
        ) : (
          <ul key={i} className="rp-list">
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
