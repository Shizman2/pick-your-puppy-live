"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { trackCta } from "../../../lib/analytics/trackClient";
import { buildSmsHref, buildTextMessage } from "../../../app/(public)/puppies/[slug]/PuppyContactButtons";
import { ASSISTANT_LIMITS } from "../../../lib/assistant/config";
import {
  ASSISTANT_ERROR_MESSAGES,
  type AssistantContactPuppy,
  type AssistantErrorCode,
  type AssistantHistoryItem,
  type AssistantPuppyCard,
  type AssistantStatus,
  type AssistantStreamEvent,
} from "../../../lib/assistant/types";
import "./assistant.css";

// Site-wide AI chat. Never opens on its own: it only renders a small
// "Ask AI" button, and only when /api/assistant/status says this visitor
// may use it (off / admin-only preview / live is decided on the server).

type ChatItem = AssistantHistoryItem | { kind: "notice"; text: string; contact: boolean };

// Errors where the visitor's best next step is texting or calling.
const STATUS_CACHE_KEY = "ppai_status";
const HELLO_KEY = "ppai_hello_shown";
// Display preferences only (no personal data): button size and side.
const PREFS_KEY = "ppai_prefs";

type LauncherPrefs = { minimized: boolean; side: "left" | "right" };
const DEFAULT_PREFS: LauncherPrefs = { minimized: false, side: "right" };

function readPrefs(): LauncherPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
    return {
      minimized: raw?.minimized === true,
      side: raw?.side === "left" ? "left" : "right",
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

const CONTACT_ON_ERROR: AssistantErrorCode[] = [
  "disabled",
  "budget_exhausted",
  "rate_limited",
  "conversation_limit",
  "new_chat_limit",
  "model_unavailable",
  "overloaded",
  "failed",
];

function ChatIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <path
        d="M12 3.5c-5.2 0-9.25 3.5-9.25 7.8 0 2.4 1.25 4.5 3.25 5.9l-.85 3.3 3.75-1.95c1 .3 2 .45 3.1.45 5.2 0 9.25-3.5 9.25-7.7S17.2 3.5 12 3.5z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path
        d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1l-2 2z"
        fill="currentColor"
      />
    </svg>
  );
}

// On-site pages Bently links to, as a path or a full thepuppyplugs.com address.
const SITE_LINK = /(?:https?:\/\/(?:www\.)?thepuppyplugs\.com)?\/(?:puppies\/[a-z0-9-]+|puppies|puppy-finder|faq|how-it-works|contact)\b/;

/** Plain text with **bold** and clickable on-site links - no HTML injection. */
function RichText({ text }: { text: string }) {
  const parts = text.split(new RegExp(`(\\*\\*[^*]+\\*\\*|${SITE_LINK.source})`, "g"));
  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (new RegExp(`^${SITE_LINK.source}$`).test(part)) {
          const path = part.replace(/^https?:\/\/(?:www\.)?thepuppyplugs\.com/, "");
          return (
            <a key={i} href={path} className="ppai-link">
              {part}
            </a>
          );
        }
        return (
          <Fragment key={i}>
            {part.split("\n").map((line, j, lines) => (
              <Fragment key={j}>
                {line}
                {j < lines.length - 1 && <br />}
              </Fragment>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}

function PuppyCards({ cards }: { cards: AssistantPuppyCard[] }) {
  return (
    <div className="ppai-cards">
      {cards.map((c) => (
        <a key={c.id} href={c.url} className="ppai-card">
          <span className="ppai-card-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {c.photoUrl ? <img src={c.photoUrl} alt={c.name} loading="lazy" /> : <span className="ppai-card-nophoto">🐶</span>}
          </span>
          <span className="ppai-card-body">
            <span className="ppai-card-top">
              <span className="ppai-card-name">{c.name}</span>
              <span className={`ppai-card-status ppai-card-status--${c.status}`}>{c.statusLabel}</span>
            </span>
            <span className="ppai-card-meta">
              {c.breed} · {c.gender === "male" ? "Male" : "Female"}
              {c.ageWeeks !== null ? ` · ${c.ageWeeks} wks` : ""}
            </span>
            <span className="ppai-card-bottom">
              {c.priceText && (
                <span className="ppai-card-price">
                  {c.wasPriceText && <s>{c.wasPriceText}</s>}
                  {c.priceText}
                </span>
              )}
              <span className="ppai-card-view">View ›</span>
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}

function ContactOptions({ phone, puppy }: { phone: string | null; puppy: AssistantContactPuppy | null }) {
  if (!phone) return null;
  const body = puppy ? buildTextMessage(puppy.name, puppy.breed, puppy.gender) : "Hi! I have a question about your puppies.";
  const label = puppy ? puppy.name : "Us";
  return (
    <div className="ppai-contact">
      <a className="ppai-contact-text" href={buildSmsHref(phone, body)} onClick={() => trackCta("text_us", puppy?.id)}>
        <ChatIcon size={18} />
        Text {puppy ? "About " : ""}
        {label}
      </a>
      <a className="ppai-contact-call" href={`tel:${phone}`} onClick={() => trackCta("call_now", puppy?.id)}>
        <PhoneIcon />
        Call {puppy ? "About " : ""}
        {label}
      </a>
    </div>
  );
}

export default function AssistantWidget({ hasBottomNav }: { hasBottomNav: boolean }) {
  const pathname = usePathname() || "/";
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [waitingFirstText, setWaitingFirstText] = useState(false);
  const [lift, setLift] = useState(0);
  const [hello, setHello] = useState(false);
  const launcherRef = useRef<HTMLDivElement>(null);
  const mainButtonRef = useRef<HTMLButtonElement>(null);
  const [prefs, setPrefs] = useState<LauncherPrefs>(DEFAULT_PREFS);
  const [menuOpen, setMenuOpen] = useState(false);
  const wasOpenRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const newBubbleRef = useRef(true);

  // May this visitor use the assistant, and which listing are they on? The
  // last answer is remembered for the session so the button shows instantly
  // on every page after the first; the server still enforces access on chat.
  useEffect(() => {
    let cancelled = false;
    try {
      const cached = sessionStorage.getItem(STATUS_CACHE_KEY);
      if (cached) {
        const s = JSON.parse(cached) as AssistantStatus;
        if (s.available) setStatus((prev) => prev ?? { ...s, puppy: null });
      }
    } catch {
      // storage unavailable - wait for the server answer
    }
    fetch(`/api/assistant/status?path=${encodeURIComponent(pathname)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: AssistantStatus | null) => {
        if (cancelled) return;
        setStatus(s?.available ? s : null);
        try {
          if (s?.available) sessionStorage.setItem(STATUS_CACHE_KEY, JSON.stringify({ ...s, puppy: null }));
          else sessionStorage.removeItem(STATUS_CACHE_KEY);
        } catch {
          // ignore
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // One gentle attention animation, the first time the button appears in a visit.
  useEffect(() => {
    if (!status) return;
    try {
      if (sessionStorage.getItem(HELLO_KEY)) return;
      sessionStorage.setItem(HELLO_KEY, "1");
    } catch {
      return;
    }
    setHello(true);
    const t = setTimeout(() => setHello(false), 2200);
    return () => clearTimeout(t);
  }, [status]);

  // Always visible, never on top of the puppy page's Text/Call buttons: when
  // they scroll into the button's spot, lift it to sit just above them.
  useEffect(() => {
    if (!status || open) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const launcher = launcherRef.current;
      const buttons = document.querySelector(".detail-contact-btns");
      if (!launcher || !buttons) {
        setLift(0);
        return;
      }
      const gap = 10;
      const b = buttons.getBoundingClientRect();
      const l = launcher.getBoundingClientRect(); // horizontal position isn't affected by the lift
      const baseBottom = parseFloat(getComputedStyle(launcher).bottom) || 0;
      const vh = window.innerHeight;
      const restBottom = vh - baseBottom; // launcher's lower edge with no lift
      const restTop = restBottom - launcher.offsetHeight;
      const sideBySide = b.right <= l.left || b.left >= l.right; // e.g. desktop, where it sits beside the page column
      const overlaps = !sideBySide && b.bottom + gap > restTop && b.top - gap < restBottom;
      setLift(overlaps ? Math.max(0, restBottom - (b.top - gap)) : 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [status, open, pathname, prefs]);

  // Restore this visitor's own chat (via their httpOnly cookie) the first time it opens.
  useEffect(() => {
    if (!open || historyLoaded || !status) return;
    setHistoryLoaded(true);
    if (!status.hasConversation) return;
    fetch("/api/assistant/conversation", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items: AssistantHistoryItem[] }) => {
        if (data.items?.length) setItems((prev) => (prev.length ? prev : data.items));
      })
      .catch(() => undefined);
  }, [open, historyLoaded, status]);

  // The customer's saved button size and side (remembered across pages and visits).
  useEffect(() => {
    setPrefs(readPrefs());
  }, []);

  const savePrefs = useCallback((next: LauncherPrefs) => {
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable - the choice still applies for this page
    }
  }, []);

  // Lock page scroll behind the full-screen chat on phones and focus the input.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Esc closes the options menu first, then the chat.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menuOpen) setMenuOpen(false);
      else setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, menuOpen]);

  // When the chat closes, put keyboard focus back on the Bently button.
  useEffect(() => {
    if (wasOpenRef.current && !open) {
      setMenuOpen(false);
      setTimeout(() => mainButtonRef.current?.focus(), 30);
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [items, waitingFirstText, open]);

  const appendText = useCallback((delta: string) => {
    setItems((prev) => {
      const last = prev[prev.length - 1];
      if (!newBubbleRef.current && last?.kind === "assistant") {
        return [...prev.slice(0, -1), { kind: "assistant", text: last.text + delta }];
      }
      newBubbleRef.current = false;
      return [...prev, { kind: "assistant", text: delta }];
    });
  }, []);

  const showError = useCallback((code: AssistantErrorCode, message?: string) => {
    setItems((prev) => [...prev, { kind: "notice", text: message || ASSISTANT_ERROR_MESSAGES[code], contact: CONTACT_ON_ERROR.includes(code) }]);
  }, []);

  async function send(textArg?: string) {
    const text = (textArg ?? input).trim();
    if (!text || sending) return;
    if (text.length > ASSISTANT_LIMITS.maxVisitorChars) {
      showError("too_long");
      return;
    }
    setInput("");
    setItems((prev) => [...prev, { kind: "user", text }]);
    setSending(true);
    setWaitingFirstText(true);
    newBubbleRef.current = true;

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, path: pathname }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        const code: AssistantErrorCode = data?.error?.code || "failed";
        if (code === "budget_exhausted") setStatus((s) => (s ? { ...s, budgetExhausted: true } : s));
        showError(code, data?.error?.message);
        return;
      }
      setStatus((s) => (s ? { ...s, hasConversation: true } : s));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;
      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          let event: AssistantStreamEvent;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }
          if (event.type === "segment") newBubbleRef.current = true;
          else if (event.type === "text") {
            setWaitingFirstText(false);
            appendText(event.delta);
          } else if (event.type === "cards") {
            setWaitingFirstText(false);
            newBubbleRef.current = true;
            setItems((prev) => [...prev, { kind: "cards", cards: event.cards }]);
          } else if (event.type === "contact_options") {
            setWaitingFirstText(false);
            newBubbleRef.current = true;
            setItems((prev) => [...prev, { kind: "contact_options", puppy: event.puppy }]);
          } else if (event.type === "error") {
            showError(event.code, event.message);
            finished = true;
          } else if (event.type === "done") finished = true;
        }
      }
    } catch {
      showError("overloaded");
    } finally {
      setSending(false);
      setWaitingFirstText(false);
    }
  }

  async function startOver() {
    if (sending) return;
    await fetch("/api/assistant/conversation", { method: "DELETE" }).catch(() => undefined);
    setItems([]);
    setStatus((s) => (s ? { ...s, hasConversation: false } : s));
    inputRef.current?.focus();
  }

  if (!status) return null;

  const pagePuppy = /^\/puppies\/[^/]+(\/contact)?\/?$/.test(pathname) ? status.puppy : null;
  // Round icon when the customer minimized Bently, or while lifted above Text/Call.
  const compact = prefs.minimized || lift > 0;
  const starters = pagePuppy
    ? [`Is ${pagePuppy.name} still available?`, `Tell me about ${pagePuppy.name}`, `How do I get ${pagePuppy.name}?`]
    : ["Help me find a puppy", "What comes with my puppy?", "How does buying work?"];

  return (
    <>
      {!open && (
        <div
          ref={launcherRef}
          className={`ppai-launcher-wrap ppai-launcher-wrap--${prefs.side}${hasBottomNav ? "" : " ppai-launcher-wrap--low"}${compact ? " ppai-launcher-wrap--min" : ""}`}
          style={lift ? { transform: `translateY(-${Math.round(lift)}px)` } : undefined}
        >
          <button
            ref={mainButtonRef}
            type="button"
            className={`ppai-launcher${hello ? " ppai-launcher--hello" : ""}${compact ? " ppai-launcher--compact" : ""}`}
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-label={pagePuppy ? `Ask Bently about ${pagePuppy.name}` : "Ask Bently"}
          >
            <ChatIcon />
            <span className="ppai-launcher-label">Ask Bently</span>
            {status.preview && <span className="ppai-launcher-badge">Preview</span>}
          </button>
          {!compact && (
            <button
              type="button"
              className="ppai-launcher-min"
              onClick={() => {
                savePrefs({ ...prefs, minimized: true });
                setTimeout(() => mainButtonRef.current?.focus(), 30);
              }}
              aria-label="Minimize Ask Bently to a small icon"
              title="Minimize"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
                <path d="M6 12h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      )}
      {/* Room at the end of the page so the floating button never sits on the last content. */}
      <div className="ppai-spacer" aria-hidden="true" />

      {open && (
        <div className={`ppai-panel ppai-panel--${prefs.side}`} role="dialog" aria-modal="true" aria-label="Bently, the Puppy Plugs AI assistant">
          <div className="ppai-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ppai-avatar" src="/logo-icon.png" alt="" />
            <div className="ppai-header-text">
              <div className="ppai-title">
                <span className="ppai-title-text">Bently</span>
                <span className="ppai-ai-badge">AI</span>
              </div>
              <div className="ppai-subtitle">
                {status.preview && <span className="ppai-preview-badge">Preview</span>}
                {status.preview ? "Only admins can see this" : "Puppy Plugs AI assistant · may make mistakes"}
              </div>
            </div>
            <div className="ppai-menu-anchor">
              <button
                type="button"
                className="ppai-icon-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Bently button options"
                title="Button options"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                  <circle cx="5" cy="12" r="2" fill="currentColor" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                  <circle cx="19" cy="12" r="2" fill="currentColor" />
                </svg>
              </button>
              {menuOpen && (
                <div className="ppai-menu" role="menu" aria-label="Bently button options">
                  <button
                    type="button"
                    role="menuitem"
                    className="ppai-menu-item"
                    autoFocus
                    onClick={() => {
                      savePrefs({ ...prefs, side: prefs.side === "right" ? "left" : "right" });
                      setMenuOpen(false);
                    }}
                  >
                    {prefs.side === "right" ? "Move Bently to the left" : "Move Bently to the right"}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="ppai-menu-item"
                    onClick={() => {
                      savePrefs({ ...prefs, minimized: !prefs.minimized });
                      setMenuOpen(false);
                    }}
                  >
                    {prefs.minimized ? "Show the full Ask Bently button" : "Minimize Bently to a small icon"}
                  </button>
                </div>
              )}
            </div>
            <button type="button" className="ppai-icon-btn" onClick={startOver} aria-label="Start a new chat" title="Start a new chat" disabled={sending}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="ppai-icon-btn" onClick={() => setOpen(false)} aria-label="Close chat">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="ppai-list" ref={listRef} aria-live="polite">
            {pagePuppy && (
              <div className="ppai-context">
                {pagePuppy.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="ppai-context-photo" src={pagePuppy.photoUrl} alt="" />
                ) : (
                  <span className="ppai-context-photo ppai-context-photo--empty">🐶</span>
                )}
                <span className="ppai-context-text">
                  You&apos;re viewing <strong>{pagePuppy.name}</strong> · {pagePuppy.breed}
                </span>
              </div>
            )}
            {status.greeting && (
              <div className="ppai-row ppai-row--assistant">
                <div className="ppai-bubble ppai-bubble--assistant">{status.greeting}</div>
              </div>
            )}

            {items.map((item, i) => {
              if (item.kind === "user") {
                return (
                  <div key={i} className="ppai-row ppai-row--user">
                    <div className="ppai-bubble ppai-bubble--user">{item.text}</div>
                  </div>
                );
              }
              if (item.kind === "assistant") {
                return (
                  <div key={i} className="ppai-row ppai-row--assistant">
                    <div className="ppai-bubble ppai-bubble--assistant">
                      <RichText text={item.text} />
                    </div>
                  </div>
                );
              }
              if (item.kind === "cards") return <PuppyCards key={i} cards={item.cards} />;
              if (item.kind === "contact_options") return <ContactOptions key={i} phone={status.phone} puppy={item.puppy} />;
              return (
                <div key={i} className="ppai-notice">
                  <p>{item.text}</p>
                  {item.contact && <ContactOptions phone={status.phone} puppy={null} />}
                </div>
              );
            })}

            {waitingFirstText && (
              <div className="ppai-row ppai-row--assistant">
                <div className="ppai-bubble ppai-bubble--assistant ppai-typing" aria-label="Assistant is typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            {items.length === 0 && !status.budgetExhausted && (
              <div className="ppai-starters">
                {starters.map((s) => (
                  <button key={s} type="button" className="ppai-starter" onClick={() => send(s)} disabled={sending}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {status.budgetExhausted ? (
            <div className="ppai-footer-notice">
              <p>{ASSISTANT_ERROR_MESSAGES.budget_exhausted}</p>
              <ContactOptions phone={status.phone} puppy={null} />
            </div>
          ) : (
            <form
              className="ppai-composer"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <textarea
                ref={inputRef}
                className="ppai-input"
                rows={1}
                value={input}
                maxLength={ASSISTANT_LIMITS.maxVisitorChars}
                placeholder="Ask about our puppies..."
                aria-label="Message"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button type="submit" className="ppai-send" disabled={sending || !input.trim()} aria-label="Send">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                  <path d="M4 12l16-8-6 16-2.5-6.5L4 12z" fill="currentColor" />
                </svg>
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
