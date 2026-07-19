export type ActivityType = "call" | "text" | "email" | "follow_up" | "task" | "other";
export type ActivityStatus = "pending" | "completed" | "cancelled";

export interface ActivityRow {
  id: string;
  contact_id: string;
  activity_type: ActivityType;
  title: string;
  due_date: string | null;
  due_time: string | null;
  status: ActivityStatus;
  completed_at: string | null;
  created_at: string;
}

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  call: "Call",
  text: "Text",
  email: "Email",
  follow_up: "Follow-up",
  task: "Task",
  other: "Other",
};

export const ACTIVITY_TYPE_ICON: Record<ActivityType, string> = {
  call: "📞",
  text: "💬",
  email: "✉️",
  follow_up: "🔁",
  task: "✅",
  other: "📌",
};
