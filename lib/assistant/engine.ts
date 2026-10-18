import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ASSISTANT_LIMITS, getModelOption } from "./config";
import { InventorySnapshot } from "./inventory";
import { DisplayTagFilter, parseDisplayTags, resolveDisplay, stripDisplayTags } from "./display";
import { buildSystemPrompt } from "./prompt";
import type { AssistantSettings } from "./settings";
import { estimateCostUsd, recordUsage, toReplayMessages, usageTotals, type MessageRowInsert, type StoredMessageRow } from "./store";
import { ASSISTANT_TOOLS, runAssistantTool } from "./tools";
import type { AssistantErrorCode, AssistantStreamEvent } from "./types";

// The reusable AI engine. It knows nothing about HTTP or the web widget:
// give it the saved transcript, the visitor's message and an emit()
// callback, and it runs one turn (model call -> tools -> model call ...)
// and returns the rows to save. The website chat route is its first
// channel; an SMS channel can call the same function later.

export class AssistantTurnError extends Error {
  code: AssistantErrorCode;
  /** Admin-facing detail (saved on the conversation, never shown to visitors). */
  detail: string;
  /** Money already spent this turn, so it still counts toward the budget. */
  costUsd: number;

  constructor(code: AssistantErrorCode, detail: string, costUsd = 0) {
    super(detail);
    this.code = code;
    this.detail = detail;
    this.costUsd = costUsd;
  }
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AssistantTurnError("model_unavailable", "ANTHROPIC_API_KEY is not set on the server.");
  }
  if (!client) client = new Anthropic({ maxRetries: 1, timeout: ASSISTANT_LIMITS.requestTimeoutMs });
  return client;
}

export function isAssistantKeyConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Drops the model-internal blocks a server-side fallback says not to echo
 * (thinking / tool_use from before the last fallback boundary) and the
 * fallback markers themselves. Everything else is kept exactly as
 * returned, so the saved history stays append-only.
 */
function sanitizeAssistantContent(blocks: Anthropic.Beta.BetaContentBlock[]): Anthropic.Beta.BetaContentBlockParam[] {
  let lastFallback = -1;
  blocks.forEach((b, i) => {
    if (b.type === "fallback") lastFallback = i;
  });
  const internal = new Set(["thinking", "redacted_thinking", "tool_use", "server_tool_use"]);
  return blocks.filter((b, i) => b.type !== "fallback" && !(i < lastFallback && internal.has(b.type))) as unknown as Anthropic.Beta.BetaContentBlockParam[];
}

function toTurnError(err: unknown, model: string, costUsd: number): AssistantTurnError {
  if (err instanceof AssistantTurnError) {
    err.costUsd = costUsd;
    return err;
  }
  if (err instanceof Anthropic.NotFoundError) {
    return new AssistantTurnError("model_unavailable", `Model "${model}" was not found or isn't available to this API key.`, costUsd);
  }
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new AssistantTurnError("model_unavailable", `Anthropic rejected the API key (${err.status}).`, costUsd);
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new AssistantTurnError("overloaded", "Anthropic rate limit reached (429).", costUsd);
  }
  if (err instanceof Anthropic.APIConnectionTimeoutError) {
    return new AssistantTurnError("overloaded", "The model request timed out.", costUsd);
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new AssistantTurnError("overloaded", "Couldn't connect to Anthropic.", costUsd);
  }
  if (err instanceof Anthropic.BadRequestError) {
    return new AssistantTurnError("failed", `Anthropic rejected the request (400): ${err.message}`, costUsd);
  }
  if (err instanceof Anthropic.APIError) {
    const overloaded = err.status === 529 || (typeof err.status === "number" && err.status >= 500);
    return new AssistantTurnError(overloaded ? "overloaded" : "failed", `Anthropic error ${err.status}: ${err.message}`, costUsd);
  }
  return new AssistantTurnError("failed", err instanceof Error ? err.message : "Unknown error", costUsd);
}

export interface AssistantTurnInput {
  settings: AssistantSettings;
  history: StoredMessageRow[];
  visitorText: string;
  /** Per-turn context (e.g. which listing is open), prepended to the visitor's message. */
  pageContext: string;
  emit: (event: AssistantStreamEvent) => void;
}

export interface AssistantTurnResult {
  rows: MessageRowInsert[];
  costUsd: number;
}

export async function runAssistantTurn({ settings, history, visitorText, pageContext, emit }: AssistantTurnInput): Promise<AssistantTurnResult> {
  const model = settings.model;
  const option = getModelOption(model);
  const anthropic = getClient();

  const betas: string[] = [];
  // Policy declines on the requested model are retried server-side on
  // Anthropic's recommended fallback model.
  if (option.supportsDefaultFallback) betas.push("server-side-fallback-2026-07-01");
  // If the admin edits the prompt mid-conversation, earlier thinking
  // blocks no longer match it; drop them instead of failing the request.
  if (option.supportsBlockBinding) betas.push("thinking-binding-controls-2026-08-01");

  const userRow: MessageRowInsert = {
    role: "user",
    content: [{ type: "text", text: pageContext ? `${pageContext}\n\n${visitorText}` : visitorText }],
    visible_text: visitorText,
    card_puppy_ids: null,
    show_contact_options: false,
    contact_puppy_id: null,
    model: null,
  };
  const rows: MessageRowInsert[] = [userRow];
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...toReplayMessages(history),
    { role: "user", content: userRow.content as Anthropic.Beta.BetaContentBlockParam[] },
  ];
  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    { type: "text", text: buildSystemPrompt(settings), cache_control: { type: "ephemeral" } },
  ];
  const inventory = new InventorySnapshot();
  let costUsd = 0;
  let turnText = "";

  for (let call = 1; call <= ASSISTANT_LIMITS.maxModelCallsPerTurn; call++) {
    // Last allowed call: no more tools, so the turn always ends with a reply.
    const finalCall = call === ASSISTANT_LIMITS.maxModelCallsPerTurn;
    emit({ type: "segment" });

    let message: Anthropic.Beta.BetaMessage;
    try {
      const stream = anthropic.beta.messages.stream({
        model,
        max_tokens: ASSISTANT_LIMITS.maxOutputTokens,
        system,
        tools: ASSISTANT_TOOLS,
        tool_choice: finalCall ? { type: "none" } : { type: "auto" },
        messages,
        thinking: option.supportsBlockBinding
          ? { type: "adaptive", block_binding: { prefix_mismatch_behavior: "drop_block" } }
          : { type: "adaptive" },
        output_config: { effort: settings.effort },
        cache_control: { type: "ephemeral" },
        ...(option.supportsDefaultFallback ? { fallbacks: "default" as const } : {}),
        ...(betas.length ? { betas } : {}),
      });
      // Display tags ([[cards: ...]], [[contact ...]]) never reach the visitor.
      const tagFilter = new DisplayTagFilter();
      stream.on("text", (delta) => {
        const visible = tagFilter.push(delta);
        if (visible) emit({ type: "text", delta: visible });
      });
      message = await stream.finalMessage();
      const tail = tagFilter.flush();
      if (tail) emit({ type: "text", delta: tail });
    } catch (err) {
      throw toTurnError(err, model, costUsd);
    }

    const totals = usageTotals(message.usage);
    const callCost = estimateCostUsd(model, totals);
    costUsd += callCost;
    await recordUsage(model, totals, callCost);

    if (message.stop_reason === "refusal") {
      throw new AssistantTurnError("declined", `Declined (${message.stop_details?.category ?? "no category"}).`, costUsd);
    }

    const content = sanitizeAssistantContent(message.content);
    const rawText = content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const text = stripDisplayTags(rawText);
    turnText += rawText;
    rows.push({
      role: "assistant",
      content,
      visible_text: text || null,
      card_puppy_ids: null,
      show_contact_options: false,
      contact_puppy_id: null,
      model: message.model,
    });
    messages.push({ role: "assistant", content });

    const toolUses = content.filter((b): b is Anthropic.Beta.BetaToolUseBlockParam => b.type === "tool_use");
    if (toolUses.length === 0) break;
    // A tool input cut off by max_tokens can still look valid - never run it.
    if (message.stop_reason === "max_tokens") {
      throw new AssistantTurnError("failed", "Model output hit max_tokens in the middle of a tool call.", costUsd);
    }

    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      const outcome = await runAssistantTool(toolUse.name, toolUse.input, inventory);
      results.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: outcome.result,
        ...(outcome.isError ? { is_error: true } : {}),
      });
    }
    rows.push({
      role: "user",
      content: results,
      visible_text: null,
      card_puppy_ids: null,
      show_contact_options: false,
      contact_puppy_id: null,
      model: null,
    });
    messages.push({ role: "user", content: results });
  }

  // Cards / Text-Call buttons requested by display tags, checked against the
  // live puppies table, shown below the reply and saved with the last reply row.
  const display = await resolveDisplay(parseDisplayTags(turnText), inventory);
  display.events.forEach(emit);
  const lastReply = [...rows].reverse().find((r) => r.role === "assistant");
  if (lastReply) {
    lastReply.card_puppy_ids = display.cardPuppyIds.length ? display.cardPuppyIds : null;
    lastReply.show_contact_options = display.showContactOptions;
    lastReply.contact_puppy_id = display.contactPuppyId;
  }

  return { rows, costUsd };
}
