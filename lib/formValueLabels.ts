/**
 * Translates a raw stored form value (e.g. "30_days") into the same
 * human-readable label its originating <select>/<RadioGroup> already
 * shows the customer (e.g. "Within 30 Days") - reusing the real label
 * from FinderForm.tsx/InquireForm.tsx rather than guessing one, per
 * the "use existing form options when possible" rule. The database
 * keeps storing the machine-safe value; only the admin display changes.
 *
 * Only covers fields that are actually shown to the admin today
 * (lib/messageCenter.ts's inquiryFieldLines) - add a field here only
 * once something admin-visible actually needs it, not speculatively.
 */
const FIELD_VALUE_LABELS: Record<string, Record<string, string>> = {
  // FinderForm.tsx ("Gender") / InquireForm.tsx puppy_finder path ("Gender preference")
  genderPreference: { male: "Male", female: "Female", either: "Either" },
  // FinderForm.tsx ("When Are You Looking?") - InquireForm's puppy_finder path uses free text for this same field, which just passes through the fallback below unchanged.
  timeframe: {
    asap: "ASAP",
    "30_days": "Within 30 Days",
    "1_3_months": "1-3 Months",
    just_researching: "Just Researching",
  },
  // InquireForm.tsx puppy_interest path ("Are you ready to place a deposit?")
  readyForDeposit: { yes: "Yes", maybe: "Maybe", not_yet: "Not yet" },
  // InquireForm.tsx puppy_finder path ("This service starts at $1,500 - is that okay?")
  budgetConfirmed: { yes: "Yes", no: "No" },
};

/** "just_researching" -> "Just researching" - only reached when no explicit label is known for that field+value, e.g. genuinely free-typed text. */
function humanizeFallback(value: string): string {
  const spaced = value.replace(/_/g, " ").trim();
  if (!spaced) return spaced;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function formValueLabel(field: keyof typeof FIELD_VALUE_LABELS | string, value: string): string {
  const known = FIELD_VALUE_LABELS[field]?.[value];
  if (known) return known;
  return humanizeFallback(value);
}
