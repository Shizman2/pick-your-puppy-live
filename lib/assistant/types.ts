// Client-safe types shared by the assistant API routes and the chat widget.

/** A listing card. Every field is read from the puppies table on the server - never from model output. */
export interface AssistantPuppyCard {
  id: string;
  slug: string;
  name: string;
  breed: string;
  gender: "male" | "female";
  ageWeeks: number | null;
  status: string;
  statusLabel: string;
  priceText: string | null;
  wasPriceText: string | null;
  photoUrl: string;
  location: string | null;
  url: string;
}

export interface AssistantContactPuppy {
  id: string;
  name: string;
  breed: string;
  gender: "male" | "female";
}

export type AssistantErrorCode =
  | "disabled"
  | "budget_exhausted"
  | "rate_limited"
  | "conversation_limit"
  | "new_chat_limit"
  | "busy"
  | "too_long"
  | "empty"
  | "model_unavailable"
  | "overloaded"
  | "declined"
  | "failed";

/** One NDJSON line streamed from POST /api/assistant/chat. */
export type AssistantStreamEvent =
  | { type: "segment" }
  | { type: "text"; delta: string }
  | { type: "cards"; cards: AssistantPuppyCard[] }
  | { type: "contact_options"; puppy: AssistantContactPuppy | null }
  | { type: "done" }
  | { type: "error"; code: AssistantErrorCode; message: string };

/** One item of saved chat history, as the widget renders it. */
export type AssistantHistoryItem =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string }
  | { kind: "cards"; cards: AssistantPuppyCard[] }
  | { kind: "contact_options"; puppy: AssistantContactPuppy | null };

/** The listing the visitor is on, so the open chat can acknowledge it. Read from the puppies table. */
export interface AssistantPagePuppy {
  id: string;
  name: string;
  breed: string;
  photoUrl: string;
}

export interface AssistantStatus {
  available: boolean;
  preview: boolean;
  budgetExhausted: boolean;
  greeting: string;
  /** E.164 seller number for the Text/Call options, or null when not configured. */
  phone: string | null;
  hasConversation: boolean;
  puppy: AssistantPagePuppy | null;
}

/** Friendly copy for each error, shown in the chat. */
export const ASSISTANT_ERROR_MESSAGES: Record<AssistantErrorCode, string> = {
  disabled: "The assistant is offline right now. You can text or call us anytime!",
  budget_exhausted: "Our AI assistant is resting for today. Text or call us and we'll help you directly!",
  rate_limited: "You're sending messages quickly! Please wait a few minutes, or text or call us.",
  conversation_limit: "We've reached the limit for this chat. Text or call us to keep going, or start a new chat.",
  new_chat_limit: "Too many new chats from this connection today. Please text or call us instead.",
  busy: "One moment, I'm still answering your last message.",
  too_long: "That message is a bit long. Could you shorten it?",
  empty: "Type a message first.",
  model_unavailable: "The assistant isn't available right now. Please text or call us!",
  overloaded: "I'm having trouble connecting. Please try again in a moment, or text or call us.",
  declined: "I can't help with that one. Feel free to ask about our puppies, or text or call us.",
  failed: "Something went wrong on my end. Please try again, or text or call us.",
};
