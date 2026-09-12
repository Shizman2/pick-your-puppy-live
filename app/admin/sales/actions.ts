"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { requireAdminUser } from "../../../lib/authz";
import { resolveCurrentAttributionForContact } from "../../../lib/affiliateAttribution";
import { createCommissionForSaleIfAttributed } from "../../../lib/commissions";
import type { PaymentMethod, PaymentType } from "../../../lib/saleTypes";
import type { FulfillmentMethod, FulfillmentStatus } from "../../../lib/affiliateTypes";

export type ActionResult = { success: true } | { success: false; error: string };
export type StartSaleResult = { success: true; saleId: string } | { success: false; error: string };

export async function startSale(
  puppyId: string,
  contactId: string,
  salePriceCents: number
): Promise<StartSaleResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();

  // Resolve which affiliate (if any) currently owns this contact, and
  // snapshot it onto the sale right now - this never gets recomputed
  // later, so a future re-attribution of the same contact can't rewrite
  // this sale's history (see blueprint section F/item 7).
  const attribution = await resolveCurrentAttributionForContact(contactId);

  const { data: sale, error } = await admin
    .from("sales")
    .insert({
      puppy_id: puppyId,
      contact_id: contactId,
      sale_price_cents: salePriceCents,
      status: "active",
      affiliate_id: attribution?.affiliateId ?? null,
      affiliate_attribution_id: attribution?.attributionId ?? null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  if (attribution) {
    await createCommissionForSaleIfAttributed(sale.id);
  }

  const { data: puppy } = await admin.from("puppies").select("name").eq("id", puppyId).maybeSingle();

  await admin.from("timeline_events").insert({
    contact_id: contactId,
    event_type: "sale_started",
    description: `Sale started for ${puppy?.name || "a puppy"} - $${(salePriceCents / 100).toLocaleString()}`,
    metadata: { sale_id: sale.id, puppy_id: puppyId },
  });

  revalidatePath("/admin/sales");
  revalidatePath(`/admin/puppies/${puppyId}`);

  return { success: true, saleId: sale.id };
}

export interface LogPaymentFields {
  amountCents: number;
  method: PaymentMethod;
  type: PaymentType;
  note: string;
  paidAt: string;
}

export async function logPayment(saleId: string, fields: LogPaymentFields): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (fields.amountCents <= 0) {
    return { success: false, error: "Enter an amount greater than zero." };
  }
  if (fields.type === "refund") {
    return { success: false, error: "Use the Refund Sale action instead - it closes the sale and handles affiliate commissions correctly." };
  }

  const admin = createAdminClient();

  const { data: sale, error: saleError } = await admin
    .from("sales")
    .select("id, puppy_id, contact_id, sale_price_cents")
    .eq("id", saleId)
    .maybeSingle();

  if (saleError) return { success: false, error: saleError.message };
  if (!sale) return { success: false, error: "Sale not found." };

  const { error: insertError } = await admin.from("payments").insert({
    sale_id: saleId,
    amount_cents: fields.amountCents,
    payment_method: fields.method,
    payment_type: fields.type,
    note: fields.note.trim() || null,
    paid_at: fields.paidAt || new Date().toISOString(),
  });

  if (insertError) return { success: false, error: insertError.message };

  const { data: allPayments } = await admin
    .from("payments")
    .select("amount_cents")
    .eq("sale_id", saleId);

  const totalPaid = (allPayments || []).reduce((sum, p) => sum + p.amount_cents, 0);

  const { data: puppy } = await admin.from("puppies").select("name, slug, status, sold_at").eq("id", sale.puppy_id).maybeSingle();

  // Did THIS payment newly complete THIS sale? (as opposed to logging an
  // extra payment on a sale that was already fully paid). Checked
  // independently of puppy.status - a puppy can already be "sold" from
  // a prior/cancelled sale when it gets resold, and that resale's
  // completion still needs to refresh sold_at to the real, new date.
  const totalPaidBeforeThisPayment = totalPaid - fields.amountCents;
  const justCompletedThisSale =
    totalPaidBeforeThisPayment < sale.sale_price_cents && totalPaid >= sale.sale_price_cents;

  if (totalPaid >= sale.sale_price_cents) {
    const puppyUpdates: Record<string, unknown> = {};
    if (puppy?.status !== "sold") puppyUpdates.status = "sold";
    if (justCompletedThisSale) puppyUpdates.sold_at = new Date().toISOString();
    if (Object.keys(puppyUpdates).length > 0) {
      await admin.from("puppies").update(puppyUpdates).eq("id", sale.puppy_id);
    }

    // sales.paid_in_full_at is the authoritative "customer has paid the
    // full balance" timestamp the affiliate commission approval rule
    // reads (see lib/affiliateTypes / approve_eligible_commissions).
    // Set once, the same way puppy.sold_at already is above - never
    // touched by a later payment correction/delete, so a typo fix can't
    // silently re-arm or disarm a commission that's already cleared
    // this gate.
    if (justCompletedThisSale) {
      await admin
        .from("sales")
        .update({ paid_in_full_at: new Date().toISOString() })
        .eq("id", saleId);
    }

    // The buyer's contact status should reflect that they actually
    // bought, not just that they were "interested" - same logic as
    // the puppy flipping to sold.
    await admin
      .from("contacts")
      .update({ status: "customer", last_activity_at: new Date().toISOString() })
      .eq("id", sale.contact_id);

    await admin.from("timeline_events").insert({
      contact_id: sale.contact_id,
      event_type: "sale_paid_in_full",
      description: `Paid in full for ${puppy?.name || "a puppy"} - $${(totalPaid / 100).toLocaleString()} total`,
      metadata: { sale_id: saleId },
    });
  } else {
    await admin.from("timeline_events").insert({
      contact_id: sale.contact_id,
      event_type: "payment_received",
      description: `Payment received: $${(fields.amountCents / 100).toLocaleString()} (${fields.type}) for ${puppy?.name || "a puppy"}`,
      metadata: { sale_id: saleId, amount_cents: fields.amountCents },
    });
  }

  revalidatePath("/admin/sales");
  revalidatePath(`/admin/sales/${saleId}`);
  revalidatePath(`/admin/puppies/${sale.puppy_id}`);
  revalidatePath("/admin/dashboard");

  // Same public-route revalidation as updatePuppy in
  // app/admin/puppies/actions.ts - a payment reaching "paid in full"
  // can flip puppy status to sold here too, so the public listings
  // need to drop it immediately rather than wait for the ISR timer.
  revalidatePath("/", "layout");
  revalidatePath("/puppies");
  if (puppy?.slug) revalidatePath(`/puppies/${puppy.slug}`);

  return { success: true };
}

export type UpdatePaymentFields = LogPaymentFields;

/**
 * Corrects an existing payment in place (amount, method, type, date,
 * note) - never inserts a second row. Deliberately does NOT touch puppy
 * status or sold_at: those only change via logPayment's own
 * full-payment check when a NEW payment is logged, never as a side
 * effect of editing/deleting a past one, so correcting a typo can't
 * silently flip a puppy back to available or vice versa.
 */
export async function updatePayment(paymentId: string, fields: UpdatePaymentFields): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (fields.amountCents <= 0) {
    return { success: false, error: "Enter an amount greater than zero." };
  }

  const admin = createAdminClient();

  const { data: payment, error: fetchError } = await admin
    .from("payments")
    .select("id, sale_id, sales(puppy_id)")
    .eq("id", paymentId)
    .maybeSingle();

  if (fetchError) return { success: false, error: fetchError.message };
  if (!payment) return { success: false, error: "Payment not found." };

  const { error } = await admin
    .from("payments")
    .update({
      amount_cents: fields.amountCents,
      payment_method: fields.method,
      payment_type: fields.type,
      note: fields.note.trim() || null,
      paid_at: fields.paidAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (error) return { success: false, error: error.message };

  const puppyId = (payment as unknown as { sales: { puppy_id: string } | null }).sales?.puppy_id;
  revalidatePath("/admin/sales");
  revalidatePath(`/admin/sales/${payment.sale_id}`);
  if (puppyId) revalidatePath(`/admin/puppies/${puppyId}`);
  revalidatePath("/admin/dashboard");

  return { success: true };
}

/** Removes a payment entirely (duplicate/mistaken entry) - same "no automatic status changes" rule as updatePayment. */
export async function deletePayment(paymentId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();

  const { data: payment, error: fetchError } = await admin
    .from("payments")
    .select("id, sale_id, sales(puppy_id)")
    .eq("id", paymentId)
    .maybeSingle();

  if (fetchError) return { success: false, error: fetchError.message };
  if (!payment) return { success: false, error: "Payment not found." };

  const { error } = await admin.from("payments").delete().eq("id", paymentId);
  if (error) return { success: false, error: error.message };

  const puppyId = (payment as unknown as { sales: { puppy_id: string } | null }).sales?.puppy_id;
  revalidatePath("/admin/sales");
  revalidatePath(`/admin/sales/${payment.sale_id}`);
  if (puppyId) revalidatePath(`/admin/puppies/${puppyId}`);
  revalidatePath("/admin/dashboard");

  return { success: true };
}

export async function cancelSale(saleId: string, reason: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  // close_sale handles the sale status change, the puppy-availability
  // side effect (cancelled only - see its own comment for why refunded
  // never auto-reverts the puppy), the commission void/flag side effect,
  // and the audit log entry, all in one transaction.
  const { error } = await admin.rpc("close_sale", {
    p_sale_id: saleId,
    p_new_status: "cancelled",
    p_reason: reason || "Cancelled by admin",
    p_closed_by: auth.userId,
    p_actor_label: auth.email || "admin",
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/sales");
  revalidatePath(`/admin/sales/${saleId}`);
  revalidatePath("/admin/commissions");
  return { success: true };
}

export interface RefundSaleFields {
  amountCents: number;
  method: PaymentMethod;
  reason: string;
  refundedAt: string;
}

/**
 * The real refund workflow (blueprint section B): records the refund as
 * a negative payment (never inflates total-paid math - see
 * 018_payments_refund_sign_fix.sql), then closes the sale via the same
 * shared close_sale path cancelSale uses, which handles the commission
 * void/flag side effect and audit log entry.
 */
export async function refundSale(saleId: string, fields: RefundSaleFields): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (fields.amountCents <= 0) {
    return { success: false, error: "Enter a refund amount greater than zero." };
  }
  if (!fields.reason.trim()) {
    return { success: false, error: "A reason is required for a refund." };
  }

  const admin = createAdminClient();

  const { error: paymentError } = await admin.from("payments").insert({
    sale_id: saleId,
    amount_cents: -Math.abs(fields.amountCents),
    payment_method: fields.method,
    payment_type: "refund",
    note: fields.reason.trim(),
    paid_at: fields.refundedAt || new Date().toISOString(),
  });

  if (paymentError) return { success: false, error: paymentError.message };

  const { error: closeError } = await admin.rpc("close_sale", {
    p_sale_id: saleId,
    p_new_status: "refunded",
    p_reason: fields.reason.trim(),
    p_closed_by: auth.userId,
    p_actor_label: auth.email || "admin",
  });

  if (closeError) return { success: false, error: closeError.message };

  revalidatePath("/admin/sales");
  revalidatePath(`/admin/sales/${saleId}`);
  revalidatePath("/admin/commissions");
  return { success: true };
}

export interface UpdateFulfillmentFields {
  method: FulfillmentMethod | null;
  status: FulfillmentStatus;
  scheduledFulfillmentAt: string | null;
  fulfilledAt: string | null;
  notes: string;
}

/**
 * fulfilled_at is the ONLY date the affiliate commission hold period
 * reads (never sale.created_at, a payment date, or puppy.sold_at - see
 * blueprint item 1). Setting it here is all that's needed to start that
 * clock: a DB trigger (sales_sync_commission_eligible_at) recomputes
 * the linked commission's eligible_at automatically.
 */
export async function updateFulfillment(saleId: string, fields: UpdateFulfillmentFields): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  if (fields.status === "completed" && !fields.fulfilledAt) {
    return { success: false, error: "A fulfilled date is required to mark fulfillment completed." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("sales")
    .update({
      fulfillment_method: fields.method,
      fulfillment_status: fields.status,
      scheduled_fulfillment_at: fields.scheduledFulfillmentAt,
      fulfilled_at: fields.status === "completed" ? fields.fulfilledAt : null,
      fulfillment_notes: fields.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", saleId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/sales");
  revalidatePath(`/admin/sales/${saleId}`);
  revalidatePath("/admin/commissions");
  return { success: true };
}
