"use client";

import { useState } from "react";
import BillOfSaleLayout from "./BillOfSaleLayout";
import HealthGuaranteeLayout from "./HealthGuaranteeLayout";
import RefundPolicyLayout from "./RefundPolicyLayout";
import PuppyPurchaseAcknowledgementLayout from "./PuppyPurchaseAcknowledgementLayout";
import EditBillOfSaleForm from "./EditBillOfSaleForm";
import type {
  GeneratedDocumentRow,
  BillOfSaleTemplateContent,
  HealthGuaranteeTemplateContent,
  RefundPolicyTemplateContent,
  PuppyPurchaseAcknowledgementTemplateContent,
} from "../../../lib/documentTypes";

interface GeneratedDocumentClientProps {
  doc: GeneratedDocumentRow;
  content:
    | BillOfSaleTemplateContent
    | HealthGuaranteeTemplateContent
    | RefundPolicyTemplateContent
    | PuppyPurchaseAcknowledgementTemplateContent;
  templateSlug: string;
}

/**
 * Draft -> Edit -> Finalize -> Reopen/Print. While draft, the sheet
 * always renders live (through whichever document type's layout
 * component matches templateSlug), so edits show immediately. Once
 * finalized, it's locked: the frozen rendered_html snapshot is shown
 * instead of the live component, and there's no un-finalize/
 * edit-after-finalize path on purpose. Every document type generated
 * from a sale shares the same underlying resolved-data shape, so one
 * client component and one edit form cover all of them.
 */
export default function GeneratedDocumentClient({ doc, content, templateSlug }: GeneratedDocumentClientProps) {
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveData = doc.edited_content || doc.resolved_data;
  const isFinalized = doc.status === "finalized";

  async function handleFinalize() {
    if (
      !confirm(
        "Finalize this document? Once finalized, it can no longer be edited and its appearance will be permanently locked, even if the layout changes later."
      )
    ) {
      return;
    }
    setError(null);
    setFinalizing(true);
    const res = await fetch(`/api/documents/${doc.id}/finalize`, { method: "POST" });
    const result = await res.json();
    setFinalizing(false);
    if (!result.success) {
      setError(result.error || "Failed to finalize this document.");
      return;
    }
    window.location.reload();
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <div className="docview-toolbar no-print">
        <span className={`docview-status-badge ${doc.status}`}>{isFinalized ? "Finalized" : "Draft"}</span>

        {!isFinalized && (
          <>
            <button
              type="button"
              className="admin-btn"
              onClick={() => setMode("preview")}
              disabled={mode === "preview"}
            >
              Preview
            </button>
            <button type="button" className="admin-btn" onClick={() => setMode("edit")} disabled={mode === "edit"}>
              Edit This Copy
            </button>
          </>
        )}

        <button type="button" className="admin-btn" onClick={handlePrint}>
          Print
        </button>

        {!isFinalized && (
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={handleFinalize}
            disabled={finalizing}
          >
            {finalizing ? "Finalizing…" : "Finalize"}
          </button>
        )}
      </div>

      {error && (
        <div className="inquire-error no-print" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}

      {!isFinalized && mode === "edit" ? (
        <EditBillOfSaleForm documentId={doc.id} initialData={effectiveData} onDone={() => setMode("preview")} />
      ) : isFinalized && doc.rendered_html ? (
        <div className="docview-sheet-wrap">
          <div dangerouslySetInnerHTML={{ __html: doc.rendered_html }} />
        </div>
      ) : (
        <div className="docview-sheet-wrap">
          {templateSlug === "health-guarantee" ? (
            <HealthGuaranteeLayout content={content as HealthGuaranteeTemplateContent} data={effectiveData} />
          ) : templateSlug === "refund-policy" ? (
            <RefundPolicyLayout content={content as RefundPolicyTemplateContent} data={effectiveData} />
          ) : templateSlug === "puppy-purchase-acknowledgement" ? (
            <PuppyPurchaseAcknowledgementLayout
              content={content as PuppyPurchaseAcknowledgementTemplateContent}
              data={effectiveData}
            />
          ) : (
            <BillOfSaleLayout content={content as BillOfSaleTemplateContent} data={effectiveData} />
          )}
        </div>
      )}
    </div>
  );
}
