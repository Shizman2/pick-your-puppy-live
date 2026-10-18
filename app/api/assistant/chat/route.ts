import { NextResponse } from "next/server";
import { ASSISTANT_LIMITS } from "../../../../lib/assistant/config";
import { getAssistantSettings } from "../../../../lib/assistant/settings";
import { puppyFromPath, resolveAssistantAccess, sanitizePath } from "../../../../lib/assistant/access";
import { AssistantTurnError, runAssistantTurn } from "../../../../lib/assistant/engine";
import { buildPageContext } from "../../../../lib/assistant/prompt";
import {
  countNewChatsForIpToday,
  countVisitorMessagesLastHour,
  createConversation,
  findOpenConversation,
  getSpendToday,
  hashIp,
  hashToken,
  loadMessages,
  newConversationToken,
  recordTurnError,
  saveTurn,
  tryLockConversation,
  unlockConversation,
  type ConversationRow,
} from "../../../../lib/assistant/store";
import { NO_STORE, chatCookieHeader, clientIp, readChatToken, readCookie } from "../../../../lib/assistant/http";
import { ANALYTICS_VISITOR_COOKIE } from "../../../../lib/analytics/constants";
import { ASSISTANT_ERROR_MESSAGES, type AssistantErrorCode, type AssistantStreamEvent } from "../../../../lib/assistant/types";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorResponse(code: AssistantErrorCode, status: number) {
  return NextResponse.json({ error: { code, message: ASSISTANT_ERROR_MESSAGES[code] } }, { status, headers: NO_STORE });
}

/**
 * One visitor message -> a streamed reply (NDJSON, one AssistantStreamEvent
 * per line). Every check below runs server-side before any model call:
 * access mode, message size, daily budget, per-IP new-chat limit,
 * per-chat message caps, and a one-turn-at-a-time lock.
 */
export async function POST(request: Request) {
  let body: { message?: unknown; path?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("failed", 400);
  }

  const { settings, missing } = await getAssistantSettings();
  const access = await resolveAssistantAccess(settings, missing);
  if (!access.allowed) return errorResponse("disabled", 403);

  const text = typeof body.message === "string" ? body.message.trim() : "";
  if (!text) return errorResponse("empty", 400);
  if (text.length > ASSISTANT_LIMITS.maxVisitorChars) return errorResponse("too_long", 400);

  // Server-enforced spending cap (America/New_York day).
  const spend = await getSpendToday().catch(() => Number.POSITIVE_INFINITY);
  if (spend >= settings.daily_budget_usd) return errorResponse("budget_exhausted", 429);

  // Existing chat (from the httpOnly cookie) or a new one.
  let conversation: ConversationRow | null = await findOpenConversation(readChatToken(request)).catch(() => null);
  let setCookie: string | null = null;
  if (!conversation) {
    const ipHash = hashIp(clientIp(request));
    if ((await countNewChatsForIpToday(ipHash)) >= settings.max_new_chats_per_ip_per_day) {
      return errorResponse("new_chat_limit", 429);
    }
    const token = newConversationToken();
    const visitorId = readCookie(request.headers.get("cookie"), ANALYTICS_VISITOR_COOKIE);
    try {
      conversation = await createConversation({
        tokenHash: hashToken(token),
        isPreview: access.preview,
        ipHash,
        analyticsVisitorId: visitorId && UUID_RE.test(visitorId) ? visitorId : null,
      });
    } catch {
      return errorResponse("failed", 500);
    }
    setCookie = chatCookieHeader(token, settings.retention_days);
  }

  if (conversation.visitor_message_count >= settings.max_messages_per_conversation) {
    return errorResponse("conversation_limit", 429);
  }
  if ((await countVisitorMessagesLastHour(conversation.id)) >= settings.max_messages_per_hour) {
    return errorResponse("rate_limited", 429);
  }
  if (!(await tryLockConversation(conversation.id, ASSISTANT_LIMITS.turnLockSeconds))) {
    return errorResponse("busy", 409);
  }

  const conv = conversation;
  const path = sanitizePath(body.path);
  let history;
  let puppy;
  try {
    [history, puppy] = await Promise.all([loadMessages(conv.id), puppyFromPath(path)]);
  } catch {
    await unlockConversation(conv.id);
    return errorResponse("failed", 500);
  }
  const pageContext = buildPageContext({
    path,
    puppy: puppy ? { id: puppy.id, name: puppy.name || puppy.breed, breed: puppy.breed } : null,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const emit = (event: AssistantStreamEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false; // visitor closed the chat; finish and save anyway
        }
      };

      try {
        const result = await runAssistantTurn({ settings, history, visitorText: text, pageContext, emit });
        await saveTurn({
          conversationId: conv.id,
          firstSeq: history.length,
          rows: result.rows,
          previousVisitorCount: conv.visitor_message_count,
          previousCost: Number(conv.total_cost_usd) || 0,
          turnCost: result.costUsd,
          pagePath: path,
          puppyId: puppy?.id ?? null,
        });
        emit({ type: "done" });
      } catch (err) {
        // Nothing from a failed turn is saved, so the transcript stays valid.
        const turnError = err instanceof AssistantTurnError ? err : new AssistantTurnError("failed", err instanceof Error ? err.message : "Unknown error");
        console.error(`[assistant] turn failed (${turnError.code}): ${turnError.detail}`);
        await recordTurnError(conv.id, turnError.detail, turnError.costUsd, Number(conv.total_cost_usd) || 0).catch(() => undefined);
        emit({ type: "error", code: turnError.code, message: ASSISTANT_ERROR_MESSAGES[turnError.code] });
      } finally {
        if (open) {
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      }
    },
  });

  const headers: Record<string, string> = {
    ...NO_STORE,
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "X-Accel-Buffering": "no",
  };
  if (setCookie) headers["Set-Cookie"] = setCookie;
  return new Response(stream, { headers });
}
