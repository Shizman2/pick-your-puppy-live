import "server-only";
import { ASSISTANT_LIMITS } from "./config";
import { toCard, toContactPuppy, type InventorySnapshot } from "./inventory";
import type { AssistantStreamEvent } from "./types";
import type { PuppyRow } from "../puppyTypes";

// Display tags: the model ends its reply with [[cards: id, id]] and/or
// [[contact: id]] / [[contact]] instead of calling a display tool (a tool
// call after the reply makes Sonnet 5.5 hide the reply text). Tags are
// stripped from everything the visitor sees - while streaming and in saved
// history - and every id is checked against the live puppies table before
// anything is shown.

/** Anything in double square brackets is treated as a tag and never shown, even if malformed. */
const TAG_RE = /\[\[([\s\S]*?)\]\]/g;
/** An unclosed "[[" this long is assumed malformed; it stays hidden. */
const MAX_TAG_LENGTH = 400;

export interface DisplayRequest {
  cardRefs: string[];
  contact: boolean;
  contactRef: string | null;
}

/** Em and en dashes are never shown to visitors (owner's style rule); they become plain hyphens. */
const DASH_RE = /[–—]/g;

/** Removes every [[...]] (and any unclosed trailing "[[...") and tidies the spacing it leaves behind. */
export function stripDisplayTags(text: string): string {
  return text
    .replace(DASH_RE, "-")
    .replace(TAG_RE, "")
    .replace(/\[\[[\s\S]*$/, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Reads the display requests out of the reply. Unknown or malformed tags are ignored. */
export function parseDisplayTags(text: string): DisplayRequest {
  const request: DisplayRequest = { cardRefs: [], contact: false, contactRef: null };
  for (const match of text.matchAll(TAG_RE)) {
    const m = match[1].trim().match(/^(cards|contact)\s*(?::\s*([\s\S]*))?$/i);
    if (!m) continue;
    const kind = m[1].toLowerCase();
    const args = (m[2] || "")
      .split(",")
      .map((a) => a.trim())
      .filter((a) => /^[A-Za-z0-9-]{1,120}$/.test(a));
    if (kind === "cards") request.cardRefs.push(...args);
    else {
      request.contact = true;
      if (!request.contactRef && args[0]) request.contactRef = args[0];
    }
  }
  request.cardRefs = Array.from(new Set(request.cardRefs));
  return request;
}

/**
 * Streaming filter: pass text deltas through and get back only what's safe
 * to show. Holds back a trailing "[" until it knows whether a tag starts,
 * and drops everything from "[[" to "]]".
 */
export class DisplayTagFilter {
  private buffer = "";
  private inTag = false;

  push(delta: string): string {
    let out = "";
    for (const ch of delta.replace(DASH_RE, "-")) {
      if (this.inTag) {
        this.buffer += ch;
        if (this.buffer.endsWith("]]")) {
          this.inTag = false;
          this.buffer = "";
        } else if (this.buffer.length > MAX_TAG_LENGTH) {
          this.buffer = this.buffer.slice(-2); // keep looking for the close; never show it
        }
        continue;
      }
      if (this.buffer === "[") {
        if (ch === "[") {
          this.inTag = true;
          this.buffer = "[[";
          continue;
        }
        out += "[";
        this.buffer = "";
      }
      if (ch === "[") this.buffer = "[";
      else out += ch;
    }
    return out;
  }

  /** End of text: a lone held "[" is shown; an unclosed tag stays hidden. */
  flush(): string {
    const out = !this.inTag && this.buffer === "[" ? "[" : "";
    this.buffer = "";
    this.inTag = false;
    return out;
  }
}

export interface ResolvedDisplay {
  events: AssistantStreamEvent[];
  cardPuppyIds: string[];
  showContactOptions: boolean;
  contactPuppyId: string | null;
}

/** Turns requests into display events using only puppies that are listed right now. Invalid ids are dropped. */
export async function resolveDisplay(request: DisplayRequest, inventory: InventorySnapshot): Promise<ResolvedDisplay> {
  const resolved: ResolvedDisplay = { events: [], cardPuppyIds: [], showContactOptions: false, contactPuppyId: null };

  const cardRows: PuppyRow[] = [];
  for (const ref of request.cardRefs) {
    if (cardRows.length >= ASSISTANT_LIMITS.maxCards) break;
    const row = await inventory.byIdOrSlug(ref);
    if (row && !cardRows.some((r) => r.id === row.id)) cardRows.push(row);
  }
  if (cardRows.length) {
    resolved.events.push({ type: "cards", cards: cardRows.map(toCard) });
    resolved.cardPuppyIds = cardRows.map((r) => r.id);
  }

  if (request.contact) {
    const row = request.contactRef ? await inventory.byIdOrSlug(request.contactRef) : null;
    const puppy = row && row.status !== "sold" ? toContactPuppy(row) : null;
    resolved.events.push({ type: "contact_options", puppy });
    resolved.showContactOptions = true;
    resolved.contactPuppyId = puppy ? puppy.id : null;
  }

  return resolved;
}
