"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import type { PaymentMethod, PaymentType } from "../../../lib/saleTypes";

export type ActionResult = { success: true } | { success: false; error: string };
export type StartSaleResult = { success: true; saleId: string } | { success: false; error: string };

async function requireAdminUser(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  return { ok: true };
}

export async function startSale(
  puppyId: string,
  contactId: string,
  salePriceCents: number
): Promise<StartSaleResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();

  const { data: sale, error } = await admin
    .from("sales")
    .insert({
      puppy_id: puppyId,
      contact_id: contactId,
      sale_price_cents: salePriceCents,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

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

  const { data: puppy } = await admin.from("puppies").select("name, status, sold_at").eq("id", sale.puppy_id).maybeSingle();

  if (totalPaid >= sale.sale_price_cents) {
    if (puppy?.status !== "sold") {
      await admin
        .from("puppies")
        .update({ status: "sold", sold_at: puppy?.sold_at || new Date().toISOString() })
        .eq("id", sale.puppy_id);
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

export async function cancelSale(saleId: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.from("sales").update({ status: "cancelled" }).eq("id", saleId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/sales");
  return { success: true };
}
