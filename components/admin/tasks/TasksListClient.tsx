"use client";

import { useState } from "react";
import Link from "next/link";
import type { TaskListItem, TasksPageData } from "../../../lib/activities";
import { ACTIVITY_TYPE_ICON, ACTIVITY_TYPE_LABEL } from "../../../lib/activityTypes";
import { completeActivity } from "../../../app/admin/tasks/actions";

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

function TaskRow({
  task,
  onComplete,
}: {
  task: TaskListItem;
  onComplete: (id: string) => void;
}) {
  const [completing, setCompleting] = useState(false);

  async function handleComplete() {
    setCompleting(true);
    onComplete(task.id);
    await completeActivity(task.id);
  }

  return (
    <div className="task-row">
      <span className="task-row-icon">{ACTIVITY_TYPE_ICON[task.activity_type]}</span>
      <div className="task-row-body">
        <div className="task-row-title">{task.title}</div>
        <div className="task-row-meta">
          <Link href={`/admin/contacts/${task.contact_id}`}>{task.contactName}</Link> ·{" "}
          {ACTIVITY_TYPE_LABEL[task.activity_type]} · {formatDueDate(task.due_date, task.due_time)}
        </div>
      </div>
      <button type="button" className="task-complete-btn" onClick={handleComplete} disabled={completing}>
        {completing ? "..." : "Mark complete"}
      </button>
    </div>
  );
}

export default function TasksListClient({ data }: { data: TasksPageData }) {
  const [groups, setGroups] = useState(data);

  function handleComplete(id: string) {
    setGroups((prev) => ({
      overdue: prev.overdue.filter((t) => t.id !== id),
      today: prev.today.filter((t) => t.id !== id),
      upcoming: prev.upcoming.filter((t) => t.id !== id),
      noDueDate: prev.noDueDate.filter((t) => t.id !== id),
    }));
  }

  const totalPending =
    groups.overdue.length + groups.today.length + groups.upcoming.length + groups.noDueDate.length;

  if (totalPending === 0) {
    return (
      <div className="contacts-page">
        <div className="contacts-page-header">
          <h1 className="contacts-title">Tasks</h1>
          <p className="contacts-subtitle">Nothing pending right now.</p>
        </div>
        <div className="contacts-empty">All caught up - no pending activities.</div>
      </div>
    );
  }

  return (
    <div className="contacts-page">
      <div className="contacts-page-header">
        <h1 className="contacts-title">Tasks</h1>
        <p className="contacts-subtitle">{totalPending} pending</p>
      </div>

      {groups.overdue.length > 0 && (
        <>
          <div className="tasks-group-title overdue">
            Overdue <span className="tasks-group-count">{groups.overdue.length}</span>
          </div>
          {groups.overdue.map((t) => (
            <TaskRow key={t.id} task={t} onComplete={handleComplete} />
          ))}
        </>
      )}

      {groups.today.length > 0 && (
        <>
          <div className="tasks-group-title">
            Today <span className="tasks-group-count">{groups.today.length}</span>
          </div>
          {groups.today.map((t) => (
            <TaskRow key={t.id} task={t} onComplete={handleComplete} />
          ))}
        </>
      )}

      {groups.upcoming.length > 0 && (
        <>
          <div className="tasks-group-title">
            Upcoming <span className="tasks-group-count">{groups.upcoming.length}</span>
          </div>
          {groups.upcoming.map((t) => (
            <TaskRow key={t.id} task={t} onComplete={handleComplete} />
          ))}
        </>
      )}

      {groups.noDueDate.length > 0 && (
        <>
          <div className="tasks-group-title">
            No due date <span className="tasks-group-count">{groups.noDueDate.length}</span>
          </div>
          {groups.noDueDate.map((t) => (
            <TaskRow key={t.id} task={t} onComplete={handleComplete} />
          ))}
        </>
      )}
    </div>
  );
}
