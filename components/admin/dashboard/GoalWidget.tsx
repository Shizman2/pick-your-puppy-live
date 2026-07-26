"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startNewGoal } from "../../../app/admin/dashboard/actions";
import type { GoalProgress } from "../../../lib/goalTypes";

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function GoalWidget({ progress }: { progress: GoalProgress | null }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [target, setTarget] = useState("50");
  const [weeks, setWeeks] = useState("12");
  const [startDate, setStartDate] = useState(todayDateInput());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setError(null);
    const targetNum = parseInt(target, 10);
    const weeksNum = parseInt(weeks, 10);
    if (!targetNum || !weeksNum) {
      setError("Enter a valid target and duration.");
      return;
    }
    setSaving(true);
    const result = await startNewGoal(targetNum, weeksNum, startDate);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  if (!progress) {
    return (
      <div className="dash2-goal-card">
        <div className="dash2-goal-title">Sales Goal</div>
        {!showForm ? (
          <>
            <p className="admin-hint" style={{ marginBottom: 10 }}>No active goal set.</p>
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => setShowForm(true)}>
              + Set a Goal
            </button>
          </>
        ) : (
          <div>
            {error && <div className="inquire-error">{error}</div>}
            <div className="admin-field">
              <label className="admin-field__label">Target (puppies)</label>
              <input className="admin-input" type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div className="admin-field">
              <label className="admin-field__label">Duration (weeks)</label>
              <input className="admin-input" type="number" value={weeks} onChange={(e) => setWeeks(e.target.value)} />
            </div>
            <div className="admin-field">
              <label className="admin-field__label">Start date</label>
              <input className="admin-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <button type="button" className="admin-btn admin-btn--primary" onClick={handleStart} disabled={saving}>
              {saving ? "Starting..." : "Start Goal"}
            </button>
          </div>
        )}
      </div>
    );
  }

  const circumference = 2 * Math.PI * 32;
  const offset = circumference - (progress.percentComplete / 100) * circumference;

  return (
    <div className="dash2-goal-card">
      <div className="dash2-goal-title">Weekly Goal Progress</div>
      <div className="dash2-goal-sub">
        Week {progress.weekNumber} of {progress.totalWeeks}
      </div>

      <div className="dash2-goal-ring-wrap">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f0fb" strokeWidth="7" />
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="#8B6BFF"
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
          />
        </svg>
        <div className="dash2-goal-ring-value">{progress.soldThisWeek}</div>
      </div>

      <div className="dash2-goal-grid">
        <div>
          <div className="dash2-goal-grid-label">Sold this week</div>
          <div className="dash2-goal-grid-value">{progress.soldThisWeek}</div>
        </div>
        <div>
          <div className="dash2-goal-grid-label">Total progress</div>
          <div className="dash2-goal-grid-value">
            {progress.soldInPeriod}/{progress.goal.target_count}
          </div>
        </div>
        <div>
          <div className="dash2-goal-grid-label">Pace needed/wk</div>
          <div className="dash2-goal-grid-value">{progress.weeklyPaceNeeded}</div>
        </div>
        <div>
          <div className="dash2-goal-grid-label">Status</div>
          <div className={`dash2-goal-grid-value ${progress.onPace ? "onpace" : "behind"}`}>
            {progress.onPace ? "On Pace ✓" : "Behind"}
          </div>
        </div>
      </div>
      <div className="admin-hint" style={{ marginTop: 8 }}>{progress.daysLeft} days left</div>
    </div>
  );
}
