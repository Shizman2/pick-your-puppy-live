import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import AssistantSettingsClient from "../../../components/admin/assistant/AssistantSettingsClient";
import { createAdminClient } from "../../../lib/supabase/admin";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadConversationCount } from "../../../lib/unreadCount";
import { getAssistantSettings } from "../../../lib/assistant/settings";
import { isAssistantKeyConfigured } from "../../../lib/assistant/engine";
import { businessDate } from "../../../lib/assistant/store";
import { getModelOption } from "../../../lib/assistant/config";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/settings/settings.css";

export const dynamic = "force-dynamic";

interface UsageRow {
  usage_date: string;
  model: string;
  requests: number;
  cost_usd: number;
}

interface ConversationSummary {
  id: string;
  is_preview: boolean;
  status: string;
  visitor_message_count: number;
  total_cost_usd: number;
  last_page_path: string | null;
  last_error: string | null;
  created_at: string;
  last_message_at: string;
}

interface TranscriptRow {
  conversation_id: string;
  seq: number;
  role: "user" | "assistant";
  visible_text: string | null;
  card_puppy_ids: string[] | null;
  show_contact_options: boolean;
}

const money = (n: number) => `$${n.toFixed(n < 1 ? 3 : 2)}`;
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default async function AssistantAdminPage() {
  const [userEmail, unreadMessageCount, { settings, missing }] = await Promise.all([
    getAdminUserEmail(),
    getUnreadConversationCount(),
    getAssistantSettings(),
  ]);
  const keyConfigured = isAssistantKeyConfigured();

  let usage: UsageRow[] = [];
  let conversations: ConversationSummary[] = [];
  const transcripts = new Map<string, TranscriptRow[]>();

  if (!missing) {
    const admin = createAdminClient();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [usageRes, convRes] = await Promise.all([
      admin.from("assistant_usage_daily").select("usage_date, model, requests, cost_usd").gte("usage_date", businessDate(since)).order("usage_date", { ascending: false }),
      admin
        .from("assistant_conversations")
        .select("id, is_preview, status, visitor_message_count, total_cost_usd, last_page_path, last_error, created_at, last_message_at")
        .order("last_message_at", { ascending: false })
        .limit(25),
    ]);
    usage = (usageRes.data || []) as UsageRow[];
    conversations = (convRes.data || []) as ConversationSummary[];

    if (conversations.length) {
      const { data } = await admin
        .from("assistant_messages")
        .select("conversation_id, seq, role, visible_text, card_puppy_ids, show_contact_options")
        .in(
          "conversation_id",
          conversations.map((c) => c.id)
        )
        .order("seq", { ascending: true });
      for (const row of (data || []) as TranscriptRow[]) {
        const list = transcripts.get(row.conversation_id) || [];
        list.push(row);
        transcripts.set(row.conversation_id, list);
      }
    }
  }

  const today = businessDate();
  const spentToday = usage.filter((u) => u.usage_date === today).reduce((s, u) => s + Number(u.cost_usd), 0);
  const usageByDay = new Map<string, { requests: number; cost: number }>();
  for (const u of usage) {
    const d = usageByDay.get(u.usage_date) || { requests: 0, cost: 0 };
    usageByDay.set(u.usage_date, { requests: d.requests + u.requests, cost: d.cost + Number(u.cost_usd) });
  }

  return (
    <AdminSidebar active="assistant" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      <div className="contacts-page">
        <div className="contacts-page-header">
          <div>
            <h1 className="contacts-title">AI Sales Assistant</h1>
            <p className="contacts-subtitle">Website chat that recommends real puppies and hands buyers to you by text or call.</p>
          </div>
        </div>

        {missing && (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Setup needed:</strong> run <code>supabase/040_ai_sales_assistant.sql</code> in the Supabase SQL editor. The
            assistant stays off until then.
          </div>
        )}
        {!keyConfigured && (
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Setup needed:</strong> add <code>ANTHROPIC_API_KEY</code> to the site&apos;s environment variables (Netlify)
            and redeploy. The assistant stays hidden until the key is present.
          </div>
        )}

        {!missing && (
          <>
            <div className="profile-card">
              <h2 className="admin-card__title">Today</h2>
              <p style={{ margin: "4px 0 0", fontWeight: 700 }}>
                Status:{" "}
                <span className={`settings-status settings-status--${settings.mode === "off" ? "off" : settings.mode === "preview" ? "warn" : "on"}`}>
                  {settings.mode === "off" ? "Off" : settings.mode === "preview" ? "Preview (admins only)" : "Live"}
                </span>
              </p>
              <p style={{ margin: "8px 0 0", fontWeight: 700 }}>
                Estimated spend today: {money(spentToday)} of {money(settings.daily_budget_usd)} ·{" "}
                {getModelOption(settings.model).label}
              </p>
              {usageByDay.size > 0 && (
                <table style={{ marginTop: 12, width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#6b7280" }}>
                      <th style={{ padding: "4px 0" }}>Day</th>
                      <th>AI requests</th>
                      <th>Est. cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(usageByDay.entries()).map(([day, d]) => (
                      <tr key={day}>
                        <td style={{ padding: "4px 0" }}>{day}</td>
                        <td>{d.requests}</td>
                        <td>{money(d.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="admin-hint" style={{ marginTop: 10 }}>
                Costs are estimates from token counts and list prices; your Anthropic console shows the exact bill.
              </p>
            </div>

            <AssistantSettingsClient initial={settings} />

            <div className="profile-card">
              <h2 className="admin-card__title">Recent Chats</h2>
              <p className="admin-hint" style={{ marginBottom: 12 }}>
                Read-only for now (taking over a chat comes in the next stage). Chats are deleted after {settings.retention_days}{" "}
                days without activity.
              </p>
              {conversations.length === 0 && <p className="admin-hint">No chats yet.</p>}
              {conversations.map((c) => (
                <details key={c.id} style={{ borderTop: "1px solid #e5e7eb", padding: "10px 0" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                    {when(c.last_message_at)} · {c.visitor_message_count} message{c.visitor_message_count === 1 ? "" : "s"} ·{" "}
                    {money(Number(c.total_cost_usd))}
                    {c.is_preview ? " · Preview" : ""}
                    {c.status === "closed" ? " · Closed" : ""}
                    {c.last_error ? " · Last turn failed" : ""}
                  </summary>
                  <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
                    {c.last_page_path && <p className="admin-hint">Last page: {c.last_page_path}</p>}
                    {c.last_error && <p className="settings-error">Last error: {c.last_error}</p>}
                    {(transcripts.get(c.id) || []).map((m) => (
                      <div key={m.seq} style={{ margin: "6px 0" }}>
                        {m.visible_text && (
                          <p style={{ margin: 0 }}>
                            <strong>{m.role === "user" ? "Visitor" : "AI"}:</strong> {m.visible_text}
                          </p>
                        )}
                        {m.card_puppy_ids?.length ? (
                          <p className="admin-hint" style={{ margin: 0 }}>
                            [Showed {m.card_puppy_ids.length} puppy card{m.card_puppy_ids.length === 1 ? "" : "s"}]
                          </p>
                        ) : null}
                        {m.show_contact_options && (
                          <p className="admin-hint" style={{ margin: 0 }}>
                            [Showed Text / Call buttons]
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminSidebar>
  );
}
