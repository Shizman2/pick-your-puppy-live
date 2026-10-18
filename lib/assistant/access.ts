import "server-only";
import { requireAdminUser } from "../authz";
import { getPuppyBySlug, getAllVisiblePuppies } from "../public-data/puppies";
import type { PuppyRow } from "../puppyTypes";
import { isAssistantKeyConfigured } from "./engine";
import { toCard, toContactPuppy } from "./inventory";
import type { AssistantSettings } from "./settings";
import type { StoredMessageRow } from "./store";
import type { AssistantHistoryItem } from "./types";

/**
 * Who may use the assistant right now. Enforced on every API call, not
 * just used to hide the button:
 *   off     -> nobody
 *   preview -> signed-in admins only (private testing)
 *   live    -> everyone
 * A missing API key or settings table means nobody.
 */
export async function resolveAssistantAccess(settings: AssistantSettings, settingsMissing: boolean): Promise<{ allowed: boolean; preview: boolean }> {
  if (settingsMissing || !isAssistantKeyConfigured()) return { allowed: false, preview: false };
  if (settings.mode === "live") return { allowed: true, preview: false };
  if (settings.mode === "preview") {
    const admin = await requireAdminUser().catch(() => ({ ok: false as const }));
    return { allowed: admin.ok, preview: admin.ok };
  }
  return { allowed: false, preview: false };
}

/** "/puppies/mimi-toy-poodle" (or its /contact page) -> the visible puppy, else null. Only the slug is taken from the client. */
export async function puppyFromPath(path: string | null): Promise<PuppyRow | null> {
  const match = path?.match(/^\/puppies\/([a-z0-9-]{1,120})(?:\/contact)?\/?$/);
  if (!match) return null;
  return getPuppyBySlug(match[1]);
}

export function sanitizePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const path = raw.split("?")[0].split("#")[0];
  return /^\/[A-Za-z0-9\-/_]{0,200}$/.test(path) ? path : null;
}

/** Saved rows -> what the widget shows. Cards are re-read from the puppies table now, so prices/status are current. */
export async function toHistoryItems(rows: StoredMessageRow[]): Promise<AssistantHistoryItem[]> {
  const needsPuppies = rows.some((r) => r.card_puppy_ids?.length || r.contact_puppy_id);
  const puppies = needsPuppies ? await getAllVisiblePuppies() : [];
  const byId = new Map(puppies.map((p) => [p.id, p]));
  const items: AssistantHistoryItem[] = [];

  for (const r of rows) {
    if (r.visible_text) items.push({ kind: r.role === "user" ? "user" : "assistant", text: r.visible_text });
    if (r.card_puppy_ids?.length) {
      const cards = r.card_puppy_ids.map((id) => byId.get(id)).filter((p): p is PuppyRow => !!p).map(toCard);
      if (cards.length) items.push({ kind: "cards", cards });
    }
    if (r.show_contact_options) {
      const p = r.contact_puppy_id ? byId.get(r.contact_puppy_id) : undefined;
      items.push({ kind: "contact_options", puppy: p && p.status !== "sold" ? toContactPuppy(p) : null });
    }
  }
  return items;
}
