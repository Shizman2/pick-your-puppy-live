// Shared, client-safe constants for the AI Sales Assistant (no secrets).

export type AssistantMode = "off" | "preview" | "live";
export type AssistantEffort = "low" | "medium" | "high";

export interface AssistantModelOption {
  id: string;
  label: string;
  /** USD per million tokens. Used for the spending cap, so they are estimates - confirm against Anthropic billing. */
  pricing: { input: number; output: number; cacheWrite: number; cacheRead: number };
  /** Server-side refusal fallback (`fallbacks: "default"`) is accepted for this model. */
  supportsDefaultFallback: boolean;
  /** Safe to send thinking.block_binding (drop stale thinking blocks after a settings edit). */
  supportsBlockBinding: boolean;
}

// Admin can switch between these to compare. Sonnet is the starting model.
export const ASSISTANT_MODELS: AssistantModelOption[] = [
  {
    id: "claude-sonnet-5-5",
    label: "Claude Sonnet 5.5 (recommended start)",
    pricing: { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
    supportsDefaultFallback: true,
    supportsBlockBinding: true,
  },
  {
    id: "claude-opus-5-5",
    label: "Claude Opus 5.5 (highest quality, ~2x cost)",
    pricing: { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 },
    supportsDefaultFallback: true,
    supportsBlockBinding: true,
  },
  {
    id: "claude-haiku-5-5",
    label: "Claude Haiku 5.5 (lowest cost)",
    pricing: { input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 },
    supportsDefaultFallback: false,
    supportsBlockBinding: false,
  },
];

export const DEFAULT_ASSISTANT_MODEL = "claude-sonnet-5-5";

export function getModelOption(id: string): AssistantModelOption {
  return ASSISTANT_MODELS.find((m) => m.id === id) || ASSISTANT_MODELS[0];
}

export const ASSISTANT_LIMITS = {
  /** Longest visitor message accepted, in characters. */
  maxVisitorChars: 800,
  /** Model calls per visitor message (tool round trips). Keeps turns inside Netlify's function time limit. */
  maxModelCallsPerTurn: 4,
  /** Output cap per model call. Replies are meant to be short. */
  maxOutputTokens: 2000,
  /** Abort a single model call after this long. */
  requestTimeoutMs: 20_000,
  /** How long a turn holds the conversation lock. */
  turnLockSeconds: 60,
  /** Most puppy cards shown at once. */
  maxCards: 4,
};

/** Chat cookie: holds the random secret that identifies a conversation. */
export const ASSISTANT_COOKIE = "pp_ai_chat";
