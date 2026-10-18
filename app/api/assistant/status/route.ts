import { NextResponse } from "next/server";
import { getAssistantSettings } from "../../../../lib/assistant/settings";
import { puppyFromPath, resolveAssistantAccess, sanitizePath } from "../../../../lib/assistant/access";
import { findOpenConversation, getSpendToday } from "../../../../lib/assistant/store";
import { NO_STORE, readChatToken } from "../../../../lib/assistant/http";
import { getSellerPhoneNumber } from "../../../../lib/content";
import { phoneE164 } from "../../../../lib/phone";
import type { AssistantStatus } from "../../../../lib/assistant/types";

export const dynamic = "force-dynamic";

const UNAVAILABLE: AssistantStatus = {
  available: false,
  preview: false,
  budgetExhausted: false,
  greeting: "",
  phone: null,
  hasConversation: false,
  puppy: null,
};

/** Whether the chat button should show for this visitor, plus the listing they're on (if any). */
export async function GET(request: Request) {
  const { settings, missing } = await getAssistantSettings();
  const access = await resolveAssistantAccess(settings, missing);
  if (!access.allowed) return NextResponse.json(UNAVAILABLE, { headers: NO_STORE });

  const path = sanitizePath(new URL(request.url).searchParams.get("path"));
  const [spend, phone, conversation, pagePuppy] = await Promise.all([
    getSpendToday().catch(() => Number.POSITIVE_INFINITY),
    getSellerPhoneNumber(),
    findOpenConversation(readChatToken(request)).catch(() => null),
    puppyFromPath(path).catch(() => null),
  ]);

  const status: AssistantStatus = {
    available: true,
    preview: access.preview,
    budgetExhausted: spend >= settings.daily_budget_usd,
    greeting: settings.greeting,
    phone: phoneE164(phone),
    hasConversation: !!conversation,
    puppy:
      pagePuppy && pagePuppy.status !== "sold"
        ? {
            id: pagePuppy.id,
            name: pagePuppy.name || pagePuppy.breed,
            breed: pagePuppy.breed,
            photoUrl: (pagePuppy.photo_urls || []).filter(Boolean)[0] || "",
          }
        : null,
  };
  return NextResponse.json(status, { headers: NO_STORE });
}
