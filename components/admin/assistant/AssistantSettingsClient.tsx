"use client";

import { useState } from "react";
import { updateAssistantSettings } from "../../../app/admin/assistant/actions";
import { ASSISTANT_MODELS, type AssistantEffort, type AssistantMode } from "../../../lib/assistant/config";
import type { AssistantSettings } from "../../../lib/assistant/settings";

const MODE_HELP: Record<AssistantMode, string> = {
  off: "Hidden everywhere. Nobody can chat.",
  preview: "Only you (signed in to admin, in the same browser) see the Ask AI button. Use this to test privately.",
  live: "Every website visitor sees the Ask AI button.",
};

export default function AssistantSettingsClient({ initial }: { initial: AssistantSettings }) {
  const [mode, setMode] = useState<AssistantMode>(initial.mode);
  const [model, setModel] = useState(initial.model);
  const [effort, setEffort] = useState<AssistantEffort>(initial.effort);
  const [budget, setBudget] = useState(String(initial.daily_budget_usd));
  const [perChat, setPerChat] = useState(String(initial.max_messages_per_conversation));
  const [perHour, setPerHour] = useState(String(initial.max_messages_per_hour));
  const [perIp, setPerIp] = useState(String(initial.max_new_chats_per_ip_per_day));
  const [retention, setRetention] = useState(String(initial.retention_days));
  const [greeting, setGreeting] = useState(initial.greeting);
  const [businessInfo, setBusinessInfo] = useState(initial.business_info);
  const [instructions, setInstructions] = useState(initial.sales_instructions);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (mode === "live" && initial.mode !== "live") {
      const confirmed = window.confirm("Turn the AI assistant on for ALL website visitors?");
      if (!confirmed) return;
    }
    setError(null);
    setSaved(false);
    setSaving(true);
    const result = await updateAssistantSettings({
      mode,
      model,
      effort,
      dailyBudgetUsd: Number(budget),
      maxMessagesPerConversation: Number(perChat),
      maxMessagesPerHour: Number(perHour),
      maxNewChatsPerIpPerDay: Number(perIp),
      retentionDays: Number(retention),
      greeting,
      businessInfo,
      salesInstructions: instructions,
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="profile-card">
      <h2 className="admin-card__title">Assistant Settings</h2>
      {error && <div className="settings-error">{error}</div>}

      <div className="admin-field">
        <label className="admin-field__label">Visibility</label>
        <select className="admin-select" value={mode} onChange={(e) => setMode(e.target.value as AssistantMode)}>
          <option value="off">Off</option>
          <option value="preview">Preview (admins only)</option>
          <option value="live">Live (all visitors)</option>
        </select>
        <p className="admin-hint" style={{ marginTop: 6 }}>
          {MODE_HELP[mode]}
        </p>
      </div>

      <div className="admin-field">
        <label className="admin-field__label">AI model</label>
        <select className="admin-select" value={model} onChange={(e) => setModel(e.target.value)}>
          {ASSISTANT_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Thinking effort</label>
        <select className="admin-select" value={effort} onChange={(e) => setEffort(e.target.value as AssistantEffort)}>
          <option value="low">Low (fastest, cheapest - recommended for chat)</option>
          <option value="medium">Medium</option>
          <option value="high">High (slowest)</option>
        </select>
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Daily spending limit (USD)</label>
        <input className="admin-input" type="number" min={0} max={1000} step="0.5" value={budget} onChange={(e) => setBudget(e.target.value)} />
        <p className="admin-hint" style={{ marginTop: 6 }}>
          Enforced on the server. Once today&apos;s estimated AI cost (Eastern time) reaches this, the assistant stops replying
          and shows your Text/Call options until tomorrow. Set 0 to pause all AI replies.
        </p>
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Max visitor messages per chat</label>
        <input className="admin-input" type="number" min={1} max={200} value={perChat} onChange={(e) => setPerChat(e.target.value)} />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Max visitor messages per chat, per hour</label>
        <input className="admin-input" type="number" min={1} max={200} value={perHour} onChange={(e) => setPerHour(e.target.value)} />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Max new chats per internet connection, per day</label>
        <input className="admin-input" type="number" min={1} max={500} value={perIp} onChange={(e) => setPerIp(e.target.value)} />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Delete chats after (days of inactivity)</label>
        <input className="admin-input" type="number" min={1} max={730} value={retention} onChange={(e) => setRetention(e.target.value)} />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Greeting</label>
        <textarea className="admin-textarea" rows={3} value={greeting} onChange={(e) => setGreeting(e.target.value)} />
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Approved business information</label>
        <textarea className="admin-textarea" rows={18} value={businessInfo} onChange={(e) => setBusinessInfo(e.target.value)} />
        <p className="admin-hint" style={{ marginTop: 6 }}>
          The ONLY source the assistant uses for policies (deposits, payments, delivery, health guarantee, what&apos;s
          included). Anything not written here, it won&apos;t claim - it offers your Text/Call options instead. Puppy
          details always come live from your puppy listings.
        </p>
      </div>

      <div className="admin-field">
        <label className="admin-field__label">Extra instructions for the assistant</label>
        <textarea className="admin-textarea" rows={6} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        <p className="admin-hint" style={{ marginTop: 6 }}>
          Style and approach (tone, what to emphasize). These can&apos;t override the built-in safety rules (no invented
          prices, no discounts, no reservations, no hypoallergenic promises).
        </p>
      </div>

      <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}
