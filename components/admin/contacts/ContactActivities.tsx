"use client";

import { useState } from "react";
import type { ActivityRow, ActivityType } from "../../../lib/activityTypes";
import { ACTIVITY_TYPE_ICON, ACTIVITY_TYPE_LABEL } from "../../../lib/activityTypes";
import { createActivity, completeActivity } from "../../../app/admin/tasks/actions";

function formatDueDate(dateStr: string | null, timeStr: string | null): string {
  if (!dateStr) return "No due date";
  const date = new Date(`${dateStr}T00:00:00`);
  const formatted = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
  if (!timeStr) return formatted;
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${formatted} at ${hour12}:${m} ${ampm}`;
}

const ACTIVITY_TYPES: ActivityType[] = ["call", "text", "email", "follow_up", "task", "other"];

export default function ContactActivities({
  contactId,
  initialActivities,
}: {
  contactId: string;
  initialActivities: ActivityRow[];
}) {
  const [activities, setActivities] = useState(initialActivities);
  const [showForm, setShowForm] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("call");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const pending = activities.filter((a) => a.status === "pending");
  const completed = activities.filter((a) => a.status === "completed");

  async function handleAdd() {
    setError(null);
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    setSaving(true);
    const result = await createActivity(contactId, {
      activityType,
      title,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    // Optimistically add a placeholder row - a full page revalidation
    // (already triggered by the server action) will true it up shortly.
    setActivities((prev) => [
      {
        id: `temp-${Date.now()}`,
        contact_id: contactId,
        activity_type: activityType,
        title: title.trim(),
        due_date: dueDate || null,
        due_time: dueTime || null,
        status: "pending",
        completed_at: null,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setTitle("");
    setDueDate("");
    setDueTime("");
    setShowForm(false);
  }

  async function handleComplete(activityId: string) {
    setCompletingId(activityId);
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activityId ? { ...a, status: "completed" as const, completed_at: new Date().toISOString() } : a
      )
    );
    await completeActivity(activityId);
    setCompletingId(null);
  }

  return (
    <div className="profile-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 className="admin-card__title" style={{ margin: 0 }}>
          Activities
        </h2>
        <button type="button" className="admin-btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {showForm && (
        <div className="activities-add-form">
          {error && <div className="inquire-error">{error}</div>}
          <select
            className="admin-select"
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as ActivityType)}
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_TYPE_ICON[t]} {ACTIVITY_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <input
            className="admin-input"
            placeholder="What needs to happen? (e.g. Call about deposit)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="activities-add-row">
            <input
              className="admin-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <input
              className="admin-input"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            />
          </div>
          <button type="button" className="admin-btn admin-btn--primary" onClick={handleAdd} disabled={saving}>
            {saving ? "Saving..." : "Save activity"}
          </button>
        </div>
      )}

      {pending.length === 0 ? (
        <div className="activities-empty">No pending activities.</div>
      ) : (
        pending.map((a) => (
          <div key={a.id} className="task-row">
            <span className="task-row-icon">{ACTIVITY_TYPE_ICON[a.activity_type]}</span>
            <div className="task-row-body">
              <div className="task-row-title">{a.title}</div>
              <div className="task-row-meta">
                {ACTIVITY_TYPE_LABEL[a.activity_type]} · {formatDueDate(a.due_date, a.due_time)}
              </div>
            </div>
            <button
              type="button"
              className="task-complete-btn"
              onClick={() => handleComplete(a.id)}
              disabled={completingId === a.id}
            >
              {completingId === a.id ? "..." : "Mark complete"}
            </button>
          </div>
        ))
      )}

      {completed.length > 0 && (
        <>
          <div className="tasks-group-title" style={{ fontSize: 12 }}>
            Completed
          </div>
          {completed.slice(0, 5).map((a) => (
            <div key={a.id} className="task-row activity-completed-row">
              <span className="task-row-icon">{ACTIVITY_TYPE_ICON[a.activity_type]}</span>
              <div className="task-row-body">
                <div className="task-row-title">{a.title}</div>
                <div className="task-row-meta">
                  {ACTIVITY_TYPE_LABEL[a.activity_type]} · Completed{" "}
                  {a.completed_at ? formatDueDate(a.completed_at.slice(0, 10), null) : ""}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
