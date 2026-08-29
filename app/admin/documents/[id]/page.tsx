import Link from "next/link";
import AdminSidebar from "../../../../components/admin/layout/AdminSidebar";
import GeneratedDocumentClient from "../../../../components/admin/documents/GeneratedDocumentClient";
import { getGeneratedDocumentById, getTemplateVersionById, getTemplateById } from "../../../../lib/documents";
import { getAdminUserEmail } from "../../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../../lib/unreadCount";
import "../../../../components/admin/layout/adminShell.css";
import "../../../../components/admin/contacts/contacts.css";
import "../../../../components/admin/documents/billOfSale.css";
import "../../../../components/admin/documents/healthGuarantee.css";
import "../../../../components/admin/documents/refundPolicy.css";
import "../../../../components/admin/documents/puppyPurchaseAcknowledgement.css";
import "../../../../components/admin/documents/documentView.css";

export const dynamic = "force-dynamic";

export default async function GeneratedDocumentPage({ params }: { params: { id: string } }) {
  let doc = null;
  let content = null;
  let templateName = "Document";
  let templateSlug = "bill-of-sale";
  let loadError: string | null = null;

  try {
    doc = await getGeneratedDocumentById(params.id);
    if (doc) {
      const [version, template] = await Promise.all([
        getTemplateVersionById(doc.template_version_id),
        getTemplateById(doc.template_id),
      ]);
      content = version?.content || null;
      templateName = template?.name || "Document";
      templateSlug = template?.slug || "bill-of-sale";
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading this document.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="sales" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header no-print">
          <h1 className="contacts-title">{templateName}</h1>
          <p className="contacts-subtitle">
            {doc?.sale_id ? (
              <Link href={`/admin/sales/${doc.sale_id}`} className="contacts-back-link">
                ← Back to Sale
              </Link>
            ) : (
              <Link href="/admin/sales" className="contacts-back-link">
                ← Back to Sales
              </Link>
            )}
          </p>
        </div>

        {loadError ? (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load this document.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        ) : !doc || !content ? (
          <div className="contacts-empty">Document not found.</div>
        ) : (
          <GeneratedDocumentClient doc={doc} content={content} templateSlug={templateSlug} />
        )}
      </div>
    </AdminSidebar>
  );
}
