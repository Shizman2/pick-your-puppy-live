import { NextResponse } from "next/server";
import { getAssistantSettings } from "../../../../lib/assistant/settings";
import { resolveAssistantAccess, toHistoryItems } from "../../../../lib/assistant/access";
import { closeConversation, findOpenConversation, loadMessages } from "../../../../lib/assistant/store";
import { NO_STORE, clearChatCookieHeader, readChatToken } from "../../../../lib/assistant/http";

export const dynamic = "force-dynamic";

/** The visitor's own saved chat - found only through their httpOnly cookie. */
export async function GET(request: Request) {
  const { settings, missing } = await getAssistantSettings();
  const access = await resolveAssistantAccess(settings, missing);
  if (!access.allowed) return NextResponse.json({ items: [] }, { headers: NO_STORE });

  const conversation = await findOpenConversation(readChatToken(request)).catch(() => null);
  if (!conversation) return NextResponse.json({ items: [] }, { headers: NO_STORE });

  try {
    const items = await toHistoryItems(await loadMessages(conversation.id));
    return NextResponse.json({ items }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ items: [] }, { headers: NO_STORE });
  }
}

/** "Start over": closes the current chat and forgets its cookie. */
export async function DELETE(request: Request) {
  const conversation = await findOpenConversation(readChatToken(request)).catch(() => null);
  if (conversation) await closeConversation(conversation.id).catch(() => undefined);
  return new NextResponse(null, { status: 204, headers: { ...NO_STORE, "Set-Cookie": clearChatCookieHeader() } });
}
