"use client";

import type { BillOfSaleResolvedData, BillOfSaleTemplateContent } from "../../../lib/documentTypes";

interface BillOfSaleLayoutProps {
  content: BillOfSaleTemplateContent;
  data: BillOfSaleResolvedData;
}

/**
 * Layer 2 - the fixed, coded print layout. Deliberately a pure,
 * presentational component (no hooks, no event handlers): it's
 * rendered both live in the browser (Draft/Preview) and through
 * React's renderToStaticMarkup on the server at finalization time (see
 * app/admin/documents/actions.ts), so it must behave identically
 * either way. Only `content` (Layer 1 wording) and `data` (resolved
 * merge fields) are ever swapped in - the physical layout itself never
 * changes based on data.
 */
export default function BillOfSaleLayout({ content, data }: BillOfSaleLayoutProps) {
  const cityStateZip = [data.buyer_city, data.buyer_state].filter(Boolean).join(", ") + (data.buyer_zip ? ` ${data.buyer_zip}` : "");

  return (
    <div className="bos-page">
      <div className="bos-header">
        <div className="bos-brand">{data.business_website}</div>
        <div className="bos-title">Puppy Purchase Record &amp; Bill of Sale</div>
        <p className="bos-intro">{content.intro_text}</p>
      </div>

      <div className="bos-columns">
        <div className="bos-col">
          <div className="bos-section">
            <div className="bos-section-title">1) {content.sections.seller_information.heading}</div>
            <Field label="Seller" value={data.business_name} />
            <Field label="Website" value={data.business_website} />
            <Field label="Phone" value={data.business_phone} />
            <Field label="Email" value={data.business_email} />
          </div>

          <div className="bos-section">
            <div className="bos-section-title">2) {content.sections.buyer_information.heading}</div>
            <Field label="Buyer Name" value={data.buyer_name} />
            <Field label="Phone Number" value={data.buyer_phone} />
            <Field label="Address" value={data.buyer_address} />
            <Field label="City / State / Zip" value={cityStateZip.trim().replace(/^,\s*/, "")} />
            <Field label="Email" value={data.buyer_email} />
          </div>

          <div className="bos-section">
            <div className="bos-section-title">3) {content.sections.puppy_information.heading}</div>
            <Field label="Puppy Name" value={data.puppy_name} />
            <Field label="Breed" value={data.puppy_breed} />
            <Field label="Sex" value={data.puppy_sex} />
            <Field label="Color / Markings" value={data.puppy_color} />
            <Field label="Date of Birth" value={data.puppy_dob} />
            <Field label="Registration" value={data.puppy_registration || "N/A"} />
            <Field label="Microchip #" value={data.puppy_microchip || "N/A"} />
          </div>
        </div>

        <div className="bos-col">
          <div className="bos-section">
            <div className="bos-section-title">5) {content.sections.puppy_photo.heading}</div>
            <div className="bos-photo-frame">
              {data.puppy_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.puppy_photo_url} alt={data.puppy_name || "Puppy"} />
              ) : (
                <span className="bos-photo-placeholder">No photo</span>
              )}
            </div>
          </div>

          <div className="bos-section">
            <div className="bos-section-title">6) {content.sections.vaccination_record.heading}</div>
            <div className="bos-sticker-row">
              <div className="bos-sticker-box">
                <span className="bos-sticker-label">Sticker</span>
              </div>
              <div className="bos-sticker-date">Date ___________</div>
            </div>
            <div className="bos-sticker-row">
              <div className="bos-sticker-box">
                <span className="bos-sticker-label">Sticker</span>
              </div>
              <div className="bos-sticker-date">Date ___________</div>
            </div>
            <div className="bos-vaccination-complete">
              {content.vaccination_complete_label}{" "}
              <span className="bos-checkbox">{data.vaccination_complete === "yes" ? "☑" : "☐"} Yes</span>{" "}
              <span className="bos-checkbox">{data.vaccination_complete === "no" ? "☑" : "☐"} No</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bos-section bos-purchase-section">
        <div className="bos-section-title">4) {content.sections.purchase_information.heading}</div>
        <div className="bos-purchase-row">
          <Field label="Date of Sale" value={data.sale_date} />
          <Field label="Total Purchase Price" value={data.sale_price} />
        </div>
        <div className="bos-purchase-row">
          <Field label="Reservation Payment" value={data.reservation_amount || "N/A"} />
          <Field label="Date Received" value={data.reservation_date || "N/A"} />
          <Field label="Method" value={data.reservation_method || "N/A"} />
        </div>
        <div className="bos-purchase-row">
          <Field label="Remaining Balance" value={data.balance_amount} />
          <Field label="Date Paid" value={data.balance_date} />
          <Field label="Method" value={data.balance_method} />
        </div>
        <div className="bos-notes-row">
          <span className="bos-notes-label">Notes:</span>
          <span className="bos-notes-line" />
        </div>
      </div>

      <div className="bos-section bos-signatures">
        <div className="bos-section-title">7) {content.sections.signatures.heading}</div>
        <div className="bos-signature-grid">
          <div className="bos-signature-block">
            <div className="bos-signature-line" />
            <div className="bos-signature-caption">Buyer Signature &nbsp;&nbsp;&nbsp; Date ___________</div>
          </div>
          <div className="bos-signature-block">
            <div className="bos-signature-line bos-signature-line--seller">{data.seller_signature}</div>
            <div className="bos-signature-caption">Seller Signature &nbsp;&nbsp;&nbsp; Date ___________</div>
          </div>
        </div>
      </div>

      <div className="bos-footer">{content.footer_text}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bos-field">
      <span className="bos-field-label">{label}:</span>
      <span className="bos-field-value">{value || " "}</span>
    </div>
  );
}
