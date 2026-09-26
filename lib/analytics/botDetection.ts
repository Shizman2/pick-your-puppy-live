/**
 * V1 bot/crawler filtering - sensible, not sophisticated. A
 * case-insensitive substring match against a curated list of well-known
 * crawler/bot/monitoring/link-preview user-agent signatures, plus
 * treating a missing or suspiciously short User-Agent header as
 * bot-like (a real browser's fetch/sendBeacon call always sends one
 * automatically, so its absence is itself a signal).
 *
 * The user-agent string is read here only to make this decision - it is
 * never written to the database (see lib/analytics/ingest.ts and the
 * privacy note in supabase/024_website_analytics.sql).
 */
const BOT_UA_SUBSTRINGS = [
  "bot",
  "spider",
  "crawl",
  "slurp",
  "bingpreview",
  "facebookexternalhit",
  "facebot",
  "whatsapp",
  "telegrambot",
  "pinterest",
  "ia_archiver",
  "semrushbot",
  "ahrefsbot",
  "mj12bot",
  "dotbot",
  "petalbot",
  "bytespider",
  "gptbot",
  "claudebot",
  "applebot",
  "yandex",
  "baiduspider",
  "duckduckbot",
  "headlesschrome",
  "phantomjs",
  "curl/",
  "wget/",
  "python-requests",
  "axios/",
  "node-fetch",
  "go-http-client",
  "uptimerobot",
  "pingdom",
];

export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent || userAgent.trim().length < 10) return true;
  const ua = userAgent.toLowerCase();
  return BOT_UA_SUBSTRINGS.some((needle) => ua.includes(needle));
}
