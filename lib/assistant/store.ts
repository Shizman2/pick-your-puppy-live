import "server-only";
import { createHash, createHmac, randomBytes } from "crypto";
import type Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "../supabase/admin";
import { getModelOption } from "./config";

// All assistant database access. Conversations are looked up ONLY by the
// hash of the secret in the visitor's httpOnly cookie, so one visitor can
// never load or post to another visitor's chat.

export interface ConversationRow {
  id: string;
  is_preview: boolean;
  status: "open" | "closed";
  visitor_message_count: number;
  total_cost_usd: number;
  created_at: string;
}

export interface MessageRowInsert {
  role: "user" | "assistant";
  content: unknown;
  visible_text: string | null;
  card_puppy_ids: string[] | null;
  show_contact_options: boolean;
  contact_puppy_id: string | null;
  model: string | null;
}

export interface StoredMessageRow extends MessageRowInsert {
  seq: number;
}

export function newConversationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Keyed hash so stored values can't be reversed to an IP by trying every address. */
export function hashIp(ip: string): string {
  return createHmac("sha256", process.env.SUPABASE_SECRET_KEY || "pp-assistant").update(`assistant-ip:${ip}`).digest("hex").slice(0, 32);
}

/** Today's date in the business's time zone, for the daily budget. */
export function businessDate(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export async function findOpenConversation(token: string | undefined): Promise<ConversationRow | null> {
  if (!token || token.length < 20 || token.length > 100) return null;
  const { data } = await createAdminClient()
    .from("assistant_conversations")
    .select("id, is_preview, status, visitor_message_count, total_cost_usd, created_at")
    .eq("token_hash", hashToken(token))
    .eq("status", "open")
    .maybeSingle();
  return (data as ConversationRow | null) || null;
}

export async function createConversation(input: {
  tokenHash: string;
  isPreview: boolean;
  ipHash: string | null;
  analyticsVisitorId: string | null;
}): Promise<ConversationRow> {
  const { data, error } = await createAdminClient()
    .from("assistant_conversations")
    .insert({
      token_hash: input.tokenHash,
      is_preview: input.isPreview,
      ip_hash: input.ipHash,
      analytics_visitor_id: input.analyticsVisitorId,
    })
    .select("id, is_preview, status, visitor_message_count, total_cost_usd, created_at")
    .single();
  if (error || !data) throw new Error(error?.message || "Could not create conversation");
  return data as ConversationRow;
}

export async function closeConversation(id: string): Promise<void> {
  await createAdminClient().from("assistant_conversations").update({ status: "closed", turn_locked_until: null }).eq("id", id);
}

export async function countNewChatsForIpToday(ipHash: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await createAdminClient()
    .from("assistant_conversations")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  return count || 0;
}

export async function countVisitorMessagesLastHour(conversationId: string): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await createAdminClient()
    .from("assistant_messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("role", "user")
    .not("visible_text", "is", null)
    .gte("created_at", since);
  return count || 0;
}

/** Throws if the spend can't be read - callers treat that as "budget reached" (fail closed). */
export async function getSpendToday(): Promise<number> {
  const { data, error } = await createAdminClient().from("assistant_usage_daily").select("cost_usd").eq("usage_date", businessDate());
  if (error) throw new Error(error.message);
  return (data || []).reduce((sum, r) => sum + Number((r as { cost_usd: number }).cost_usd || 0), 0);
}

export async function tryLockConversation(id: string, seconds: number): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("assistant_try_lock_conversation", {
    p_conversation_id: id,
    p_seconds: seconds,
  });
  return !error && data === true;
}

export async function unlockConversation(id: string): Promise<void> {
  await createAdminClient().from("assistant_conversations").update({ turn_locked_until: null }).eq("id", id);
}

export async function loadMessages(conversationId: string): Promise<StoredMessageRow[]> {
  const { data, error } = await createAdminClient()
    .from("assistant_messages")
    .select("seq, role, content, visible_text, card_puppy_ids, show_contact_options, contact_puppy_id, model")
    .eq("conversation_id", conversationId)
    .order("seq", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as StoredMessageRow[];
}

/** The saved transcript exactly as the model produced it (append-only replay). */
export function toReplayMessages(rows: StoredMessageRow[]): Anthropic.Beta.BetaMessageParam[] {
  return rows.map((r) => ({ role: r.role, content: r.content as Anthropic.Beta.BetaMessageParam["content"] }));
}

/** Saves one completed turn in a single insert, then updates the conversation. */
export async function saveTurn(input: {
  conversationId: string;
  firstSeq: number;
  rows: MessageRowInsert[];
  previousVisitorCount: number;
  previousCost: number;
  turnCost: number;
  pagePath: string | null;
  puppyId: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("assistant_messages").insert(
    input.rows.map((r, i) => ({ ...r, conversation_id: input.conversationId, seq: input.firstSeq + i }))
  );
  if (error) throw new Error(error.message);
  await admin
    .from("assistant_conversations")
    .update({
      visitor_message_count: input.previousVisitorCount + 1,
      total_cost_usd: input.previousCost + input.turnCost,
      last_message_at: new Date().toISOString(),
      last_page_path: input.pagePath,
      last_puppy_id: input.puppyId,
      last_error: null,
      turn_locked_until: null,
    })
    .eq("id", input.conversationId);
}

export async function recordTurnError(conversationId: string, message: string, addedCost: number, previousCost: number) {
  await createAdminClient()
    .from("assistant_conversations")
    .update({ last_error: message.slice(0, 500), total_cost_usd: previousCost + addedCost, turn_locked_until: null })
    .eq("id", conversationId);
}

export interface UsageTotals {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

/** Tokens for one API call. With a server-side fallback, every attempt is listed in usage.iterations. */
export function usageTotals(usage: Anthropic.Beta.BetaUsage): UsageTotals {
  const iterations = (usage.iterations || []).filter((it) => "input_tokens" in it && "output_tokens" in it) as Array<{
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number | null;
    cache_creation_input_tokens?: number | null;
  }>;
  const parts =
    iterations.length > 0
      ? iterations
      : [
          {
            input_tokens: usage.input_tokens,
            output_tokens: usage.output_tokens,
            cache_read_input_tokens: usage.cache_read_input_tokens,
            cache_creation_input_tokens: usage.cache_creation_input_tokens,
          },
        ];
  return parts.reduce<UsageTotals>(
    (t, p) => ({
      input: t.input + (p.input_tokens || 0),
      output: t.output + (p.output_tokens || 0),
      cacheRead: t.cacheRead + (p.cache_read_input_tokens || 0),
      cacheWrite: t.cacheWrite + (p.cache_creation_input_tokens || 0),
    }),
    { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
  );
}

export function estimateCostUsd(model: string, t: UsageTotals): number {
  const p = getModelOption(model).pricing;
  return (t.input * p.input + t.output * p.output + t.cacheRead * p.cacheRead + t.cacheWrite * p.cacheWrite) / 1_000_000;
}

/** Best-effort: a failed usage write is logged, never surfaced to the visitor. */
export async function recordUsage(model: string, t: UsageTotals, costUsd: number): Promise<void> {
  const { error } = await createAdminClient().rpc("assistant_record_usage", {
    p_usage_date: businessDate(),
    p_model: model,
    p_input_tokens: t.input,
    p_output_tokens: t.output,
    p_cache_read_tokens: t.cacheRead,
    p_cache_write_tokens: t.cacheWrite,
    p_cost_usd: costUsd,
  });
  if (error) console.error("[assistant] usage record failed:", error.message);
}
