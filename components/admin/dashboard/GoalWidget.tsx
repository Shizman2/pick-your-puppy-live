"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startNewGoal, updateGoal } from "../../../app/admin/dashboard/actions";
import type { GoalProgress } from "../../../lib/goalTypes";
import { formatPriceFromCents } from "../../../lib/puppyTypes";

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Gross profit can be negative (a loss period) - formatPriceFromCents alone would render that as "$-500" instead of "-$500". */
function formatSignedPriceFromCents(cents: number): string {
  return cents < 0 ? `-${formatPriceFromCents(-cents)}` : formatPriceFromCents(cents);
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

interface GoalFormValues {
  name: string;
  target: string;
  startDate: string;
  endDate: string;
  revenueGoal: string;
  profitGoal: string;
}

function GoalForm({
  initial,
  saving,
  error,
  onSave,
  onCancel,
}: {
  initial: GoalFormValues;
  saving: boolean;
  error: string | null;
  onSave: (values: GoalFormValues) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [target, setTarget] = useState(initial.target);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [revenueGoal, setRevenueGoal] = useState(initial.revenueGoal);
  const [profitGoal, setProfitGoal] = useState(initial.profitGoal);

  return (
    <div>
      {error && <div className="inquire-error">{error}</div>}
      <div className="admin-field">
        <label className="admin-field__label">Goal name</label>
        <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Target puppies</label>
        <input className="admin-input" type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Start date</label>
        <input className="admin-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">End date</label>
        <input className="admin-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Revenue goal ($, optional)</label>
        <input
          className="admin-input"
          type="number"
          value={revenueGoal}
          onChange={(e) => setRevenueGoal(e.target.value)}
          placeholder="e.g. 50000"
        />
      </div>
      <div className="admin-field">
        <label className="admin-field__label">Profit goal ($, optional)</label>
        <input
          className="admin-input"
          type="number"
          value={profitGoal}
          onChange={(e) => setProfitGoal(e.target.value)}
          placeholder="e.g. 20000"
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          disabled={saving}
          onClick={() => onSave({ name, target, startDate, endDate, revenueGoal, profitGoal })}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {onCancel && (
          <button type="button" className="admin-btn" disabled={saving} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

interface RingSpec {
  key: string;
  caption: string;
  percent: number | null;
  subValue: string;
  strokeColor: string;
}

const RING_SIZE = 64;
const RING_RADIUS = 26;
const RING_STROKE = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function GoalRing({ ring }: { ring: RingSpec }) {
  const percent = ring.percent ?? 0;
  const offset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="dash2-goal-ring-item">
      <div className="dash2-goal-ring-wrap dash2-goal-ring-wrap--small">
        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="#f1f0fb"
            strokeWidth={RING_STROKE}
          />
          {ring.percent !== null && (
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={ring.strokeColor}
              strokeWidth={RING_STROKE}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          )}
        </svg>
        <div className="dash2-goal-ring-value dash2-goal-ring-value--small">
          {ring.percent !== null ? `${ring.percent}%` : "—"}
        </div>
      </div>
      <div className="dash2-goal-ring-caption">{ring.caption}</div>
      <div className="dash2-goal-ring-subvalue">{ring.subValue}</div>
    </div>
  );
}

export default function GoalWidget({ progress }: { progress: GoalProgress | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(values: GoalFormValues) {
    setError(null);
    const targetNum = parseInt(values.target, 10);
    if (!targetNum) {
      setError("Enter a valid target.");
      return;
    }
    const revenueGoalDollars = values.revenueGoal.trim() ? parseFloat(values.revenueGoal) : null;
    const profitGoalDollars = values.profitGoal.trim() ? parseFloat(values.profitGoal) : null;
    setSaving(true);
    const result = progress
      ? await updateGoal(progress.goal.id, values.name, targetNum, values.startDate, values.endDate, revenueGoalDollars, profitGoalDollars)
      : await startNewGoal(values.name, targetNum, values.startDate, values.endDate, revenueGoalDollars, profitGoalDollars);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!progress) {
    return (
      <div className="dash2-goal-card">
        <div className="dash2-goal-title">Sales Goal</div>
        {!editing ? (
          <>
            <p className="admin-hint" style={{ marginBottom: 10 }}>
              No active goal set.
            </p>
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => setEditing(true)}>
              + Set a Goal
            </button>
          </>
        ) : (
          <GoalForm
            initial={{
              name: "Q4 Goal",
              target: "25",
              startDate: "2026-10-03",
              endDate: "2026-12-31",
              revenueGoal: "",
              profitGoal: "",
            }}
            saving={saving}
            error={error}
            onSave={handleSave}
          />
        )}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="dash2-goal-card">
        <div className="dash2-goal-title">Edit Goal</div>
        <GoalForm
          initial={{
            name: progress.goal.name || "",
            target: String(progress.goal.target_count),
            startDate: progress.goal.start_date.slice(0, 10),
            endDate: (progress.goal.end_date || todayDateInput()).slice(0, 10),
            revenueGoal: progress.goal.revenue_goal_cents != null ? String(progress.goal.revenue_goal_cents / 100) : "",
            profitGoal: progress.goal.profit_goal_cents != null ? String(progress.goal.profit_goal_cents / 100) : "",
          }}
          saving={saving}
          error={error}
          onSave={handleSave}
          onCancel={() => {
            setError(null);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  const goalName = progress.goal.name || "Sales Goal";
  const dateRangeLabel =
    progress.goal.end_date != null ? formatDateRange(progress.goal.start_date, progress.goal.end_date) : null;

  // The old "Status: On Pace/Behind" text row isn't in the approved
  // reference design - the Puppies ring's own color carries that same
  // signal instead (green = on pace, red = behind), so the information
  // isn't lost, just shown visually rather than as a separate line.
  const rings: RingSpec[] = [
    {
      key: "puppies",
      caption: "Puppies",
      percent: progress.percentComplete,
      subValue: `${progress.soldInPeriod} / ${progress.goal.target_count}`,
      strokeColor: progress.onPace ? "#16a34a" : "#dc2626",
    },
    {
      key: "revenue",
      caption: "Revenue",
      percent: progress.revenuePercentComplete,
      subValue:
        progress.goal.revenue_goal_cents != null
          ? `${formatPriceFromCents(progress.revenueCents)} / ${formatPriceFromCents(progress.goal.revenue_goal_cents)}`
          : "No goal set",
      strokeColor: "#8B6BFF",
    },
    {
      key: "profit",
      caption: "Profit",
      percent: progress.profitPercentComplete,
      subValue:
        progress.goal.profit_goal_cents != null
          ? `${formatSignedPriceFromCents(progress.profitCents)} / ${formatPriceFromCents(progress.goal.profit_goal_cents)}`
          : "No goal set",
      strokeColor: "#2563eb",
    },
  ];

  return (
    <div className="dash2-goal-card">
      <div className="dash2-goal-card-header">
        <div>
          <div className="dash2-goal-title">{goalName}</div>
          {dateRangeLabel && <div className="dash2-goal-sub">{dateRangeLabel}</div>}
        </div>
        <button type="button" className="dash2-goal-edit-btn" onClick={() => setEditing(true)}>
          Edit Goal
        </button>
      </div>

      <div className="dash2-goal-rings-row">
        {rings.map((ring) => (
          <GoalRing key={ring.key} ring={ring} />
        ))}
      </div>

      <div className="dash2-goal-grid">
        <div>
          <div className="dash2-goal-grid-label">Needed/Wk</div>
          <div className="dash2-goal-grid-value">{progress.weeklyPaceNeeded}</div>
        </div>
        <div>
          <div className="dash2-goal-grid-label">Avg Sale</div>
          <div className="dash2-goal-grid-value">{formatPriceFromCents(progress.avgSaleCents)}</div>
        </div>
        <div>
          <div className="dash2-goal-grid-label">Avg Profit/Puppy</div>
          <div className="dash2-goal-grid-value">{formatSignedPriceFromCents(progress.avgProfitPerPuppyCents)}</div>
        </div>
        <div>
          <div className="dash2-goal-grid-label">Days Left</div>
          <div className="dash2-goal-grid-value">{progress.daysLeft}</div>
        </div>
      </div>
    </div>
  );
}
