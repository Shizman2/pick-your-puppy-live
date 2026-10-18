import "server-only";
import { ASSISTANT_COOKIE } from "./config";

// Cookie + request helpers for the assistant API routes.

export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  const part = header.split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : undefined;
}

export function readChatToken(request: Request): string | undefined {
  return readCookie(request.headers.get("cookie"), ASSISTANT_COOKIE);
}

/** httpOnly (never readable by page scripts), scoped to the assistant API, kept for the retention window. */
export function chatCookieHeader(token: string, maxAgeDays: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ASSISTANT_COOKIE}=${token}; Path=/api/assistant; HttpOnly; SameSite=Lax; Max-Age=${Math.round(maxAgeDays * 86400)}${secure}`;
}

export function clearChatCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ASSISTANT_COOKIE}=; Path=/api/assistant; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

export const NO_STORE = { "Cache-Control": "no-store" };
