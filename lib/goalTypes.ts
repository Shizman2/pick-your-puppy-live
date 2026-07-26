export interface SalesGoalRow {
  id: string;
  target_count: number;
  duration_weeks: number;
  start_date: string;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  goal: SalesGoalRow;
  soldInPeriod: number;
  soldThisWeek: number;
  weekNumber: number;
  totalWeeks: number;
  daysLeft: number;
  weeklyPaceNeeded: number;
  onPace: boolean;
  percentComplete: number;
}
