/**
 * Point values for the additive lead-score rules that fire at
 * inquiry-submission time. The 60-day-inactivity decay rule from the
 * approved spec is NOT implemented here - that requires a scheduled
 * job that periodically checks last_activity_at across all contacts,
 * which is a separate piece of infrastructure, not something that can
 * hook into a single form submission. Flagging that as follow-up work
 * rather than silently leaving it out unmentioned.
 */
export function calculateScoreBump(params: {
  inquiryType: "puppy_interest" | "puppy_finder" | "pypl" | "general";
  readyForDeposit?: string | null;
}): number {
  let points = 0;

  if (params.inquiryType === "pypl") points += 20;
  if (params.inquiryType === "puppy_finder") points += 30;
  if (params.inquiryType === "puppy_interest") points += 15;
  if (params.readyForDeposit === "yes") points += 30;

  return points;
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
