import "server-only";
import { readFile } from "fs/promises";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import BillOfSaleLayout from "../components/admin/documents/BillOfSaleLayout";
import HealthGuaranteeLayout from "../components/admin/documents/HealthGuaranteeLayout";
import RefundPolicyLayout from "../components/admin/documents/RefundPolicyLayout";
import PuppyPurchaseAcknowledgementLayout from "../components/admin/documents/PuppyPurchaseAcknowledgementLayout";
import type {
  BillOfSaleResolvedData,
  BillOfSaleTemplateContent,
  HealthGuaranteeTemplateContent,
  RefundPolicyTemplateContent,
  PuppyPurchaseAcknowledgementTemplateContent,
} from "./documentTypes";

const CSS_FILE_BY_SLUG: Record<string, string> = {
  "bill-of-sale": "billOfSale.css",
  "health-guarantee": "healthGuarantee.css",
  "refund-policy": "refundPolicy.css",
  "puppy-purchase-acknowledgement": "puppyPurchaseAcknowledgement.css",
};

/**
 * Kept in its own plain module (no "use server") rather than inside a
 * Server Action - Next's App Router bundler hard-blocks react-dom/
 * server anywhere reachable from app/ (Server Actions and Route
 * Handlers alike), which is why finalization ultimately runs from a
 * Pages Router API route (pages/api/documents/[id]/finalize.ts) that
 * calls this function, not from app/admin/documents/actions.ts.
 *
 * One dispatcher, not a per-document-type render helper - adding
 * another document type later only means one more case here plus one
 * CSS_FILE_BY_SLUG entry. Produces the frozen finalization snapshot
 * via renderToStaticMarkup (no Puppeteer, no headless browser, no PDF)
 * with that document type's own CSS inlined from disk, so the result
 * is fully self-contained and immune to future edits to either the
 * layout components or their stylesheets.
 */
export async function renderDocumentHtml(
  templateSlug: string,
  content:
    | BillOfSaleTemplateContent
    | HealthGuaranteeTemplateContent
    | RefundPolicyTemplateContent
    | PuppyPurchaseAcknowledgementTemplateContent,
  data: BillOfSaleResolvedData
): Promise<string> {
  let bodyMarkup: string;
  if (templateSlug === "health-guarantee") {
    bodyMarkup = renderToStaticMarkup(
      <HealthGuaranteeLayout content={content as HealthGuaranteeTemplateContent} data={data} />
    );
  } else if (templateSlug === "refund-policy") {
    bodyMarkup = renderToStaticMarkup(
      <RefundPolicyLayout content={content as RefundPolicyTemplateContent} data={data} />
    );
  } else if (templateSlug === "puppy-purchase-acknowledgement") {
    bodyMarkup = renderToStaticMarkup(
      <PuppyPurchaseAcknowledgementLayout
        content={content as PuppyPurchaseAcknowledgementTemplateContent}
        data={data}
      />
    );
  } else {
    bodyMarkup = renderToStaticMarkup(<BillOfSaleLayout content={content as BillOfSaleTemplateContent} data={data} />);
  }

  const cssFileName = CSS_FILE_BY_SLUG[templateSlug] || "billOfSale.css";
  const cssPath = path.join(process.cwd(), "components/admin/documents", cssFileName);
  const css = await readFile(cssPath, "utf-8");

  return `<style>${css}</style>${bodyMarkup}`;
}
