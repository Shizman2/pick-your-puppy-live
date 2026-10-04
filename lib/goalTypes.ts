export interface SalesGoalRow {
  id: string;
  name: string | null;
  target_count: number;
  duration_weeks: number;
  start_date: string;
  end_date: string | null;
  status: "active" | "completed" | "cancelled";
  /** Nullable - a goal can track puppy count only, with no revenue/profit target set (see supabase/030_ad_spend_and_revenue_profit_goals.sql). */
  revenue_goal_cents: number | null;
  profit_goal_cents: number | null;
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  goal: SalesGoalRow;
  soldInPeriod: number;
  soldThisWeek: number;
  daysLeft: number;
  weeklyPaceNeeded: number;
  onPace: boolean;
  percentComplete: number;
  /** Real revenue/profit collected within the goal's own date range - see lib/businessScorecard.ts getPeriodFinancials. */
  revenueCents: number;
  profitCents: number;
  /** null when the goal has no revenue/profit target set - shown as "no goal set", never a fabricated percentage. */
  revenuePercentComplete: number | null;
  profitPercentComplete: number | null;
  avgSaleCents: number;
  avgProfitPerPuppyCents: number;
}
