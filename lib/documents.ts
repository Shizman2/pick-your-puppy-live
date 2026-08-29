import "server-only";
import { createAdminClient } from "./supabase/admin";
import { formatDateOnly } from "./formatDate";
import { formatPriceFromCents } from "./puppyTypes";
import { PAYMENT_METHOD_LABEL } from "./saleTypes";
import type { PaymentRow } from "./saleTypes";
import { getSellerPhoneNumber, getSellerSignatureName, getContentBlocksForPage } from "./content";
import type {
  DocumentTemplateRow,
  DocumentTemplateVersionRow,
  BillOfSaleResolvedData,
  GeneratedDocumentRow,
} from "./documentTypes";

const BUSINESS_NAME = "The Puppy Plugs";
const BUSINESS_WEBSITE = "ThePuppyPlugs.com";

/** Fetches an active template by slug plus its current (highest-numbered) version - "bill-of-sale", "health-guarantee", etc. */
export async function getActiveTemplateBySlug(slug: string): Promise<{
  template: DocumentTemplateRow;
  version: DocumentTemplateVersionRow;
} | null> {
  const admin = createAdminClient();

  const { data: template, error: templateError } = await admin
    .from("document_templates")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (templateError) throw new Error(templateError.message);
  if (!template) return null;

  const { data: version, error: versionError } = await admin
    .from("document_template_versions")
    .select("*")
    .eq("template_id", template.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError) throw new Error(versionError.message);
  if (!version) return null;

  return {
    template: template as DocumentTemplateRow,
    version: version as DocumentTemplateVersionRow,
  };
}

export async function getTemplateById(id: string): Promise<DocumentTemplateRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("document_templates").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  return (data as DocumentTemplateRow) || null;
}

function genderLabel(gender: string | null): string {
  if (gender === "male") return "Male";
  if (gender === "female") return "Female";
  return "";
}

/**
 * Splits a sale's payments into "reservation" (the deposit) and
 * "balance" (everything else), matching the approved Bill of Sale
 * layout. If there's no deposit, reservation fields stay blank. If the
 * non-deposit payments used more than one method, the method shows
 * "Multiple" rather than guessing which one to display.
 */
function resolvePayments(payments: PaymentRow[]): {
  reservation_amount: string;
  reservation_date: string;
  reservation_method: string;
  balance_amount: string;
  balance_date: string;
  balance_method: string;
} {
  const deposit = payments.find((p) => p.payment_type === "deposit") || null;
  const others = payments.filter((p) => p.payment_type !== "deposit");

  const balanceTotalCents = others.reduce((sum, p) => sum + p.amount_cents, 0);
  const mostRecentOther =
    others.length > 0
      ? others.reduce((latest, p) => (p.paid_at > latest.paid_at ? p : latest))
      : null;
  const distinctOtherMethods = new Set(others.map((p) => p.payment_method));

  return {
    reservation_amount: deposit ? formatPriceFromCents(deposit.amount_cents) : "",
    reservation_date: deposit ? formatDateOnly(deposit.paid_at) : "",
    reservation_method: deposit ? PAYMENT_METHOD_LABEL[deposit.payment_method] : "",
    balance_amount: others.length > 0 ? formatPriceFromCents(balanceTotalCents) : "",
    balance_date: mostRecentOther ? formatDateOnly(mostRecentOther.paid_at) : "",
    balance_method:
      others.length === 0
        ? ""
        : distinctOtherMethods.size > 1
        ? "Multiple"
        : PAYMENT_METHOD_LABEL[others[0].payment_method],
  };
}

export interface SaleDocumentContext {
  contactId: string;
  puppyId: string;
  resolvedData: BillOfSaleResolvedData;
}

/**
 * Resolves every Bill of Sale merge field from the real Contact/Puppy/
 * Sale/Payment rows for one sale, plus the business's own phone/email
 * (already-existing settings, not new fields). Business name/website
 * stay constants per the approved plan - not stored anywhere as data.
 */
export async function getSaleDocumentContext(saleId: string): Promise<SaleDocumentContext | null> {
  const admin = createAdminClient();

  const { data: sale, error: saleError } = await admin
    .from("sales")
    .select("*, puppies(*), contacts(*)")
    .eq("id", saleId)
    .maybeSingle();

  if (saleError) throw new Error(saleError.message);
  if (!sale) return null;

  const puppy = (sale as any).puppies;
  const contact = (sale as any).contacts;
  if (!puppy || !contact) return null;

  const { data: paymentsData, error: paymentsError } = await admin
    .from("payments")
    .select("*")
    .eq("sale_id", saleId)
    .order("paid_at", { ascending: true });

  if (paymentsError) throw new Error(paymentsError.message);
  const payments = (paymentsData || []) as PaymentRow[];

  const [businessPhone, sellerSignature, contactBlocks] = await Promise.all([
    getSellerPhoneNumber(),
    getSellerSignatureName(),
    getContentBlocksForPage("contact").catch(() => []),
  ]);
  const businessEmail = contactBlocks.find((b) => b.section_key === "email")?.text_value || "";

  const paymentFields = resolvePayments(payments);

  const resolvedData: BillOfSaleResolvedData = {
    buyer_name: contact.display_name || `${contact.first_name} ${contact.last_name || ""}`.trim(),
    buyer_phone: contact.phone || "",
    buyer_email: contact.email || "",
    buyer_address: contact.address || "",
    buyer_city: contact.city || "",
    buyer_state: contact.state || "",
    buyer_zip: contact.zip || "",

    puppy_name: puppy.name || "",
    puppy_breed: puppy.breed || "",
    puppy_sex: genderLabel(puppy.gender),
    puppy_dob: puppy.date_of_birth ? formatDateOnly(puppy.date_of_birth) : "",
    puppy_color: puppy.color || "",
    puppy_registration: puppy.registration || "",
    puppy_microchip: puppy.microchip || "",
    puppy_photo_url: Array.isArray(puppy.photo_urls) ? puppy.photo_urls[0] || "" : "",

    sale_date: formatDateOnly(sale.created_at),
    sale_price: formatPriceFromCents(sale.sale_price_cents),

    ...paymentFields,

    vaccination_complete: "",

    business_name: BUSINESS_NAME,
    business_website: BUSINESS_WEBSITE,
    business_phone: businessPhone || "",
    business_email: businessEmail,

    seller_signature: sellerSignature,
  };

  return { contactId: contact.id, puppyId: puppy.id, resolvedData };
}

export interface GeneratedDocumentListItem {
  id: string;
  status: "draft" | "finalized";
  generatedAt: string;
  finalizedAt: string | null;
  templateName: string;
}

export async function getGeneratedDocumentsForSale(saleId: string): Promise<GeneratedDocumentListItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("generated_documents")
    .select("id, status, generated_at, finalized_at, document_templates(name)")
    .eq("sale_id", saleId)
    .order("generated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => ({
    id: row.id,
    status: row.status,
    generatedAt: row.generated_at,
    finalizedAt: row.finalized_at,
    templateName: row.document_templates?.name || "Document",
  }));
}

export async function getGeneratedDocumentById(id: string): Promise<GeneratedDocumentRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("generated_documents").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  return (data as GeneratedDocumentRow) || null;
}

export async function getTemplateVersionById(id: string): Promise<DocumentTemplateVersionRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("document_template_versions").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  return (data as DocumentTemplateVersionRow) || null;
}
