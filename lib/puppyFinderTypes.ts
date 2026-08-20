export type ProposalStatus = "proposed" | "selected" | "deposit_confirmed";
export type OptionStatus = "active" | "withdrawn";

export interface PuppyFinderProposalRow {
  id: string;
  contact_id: string;
  inquiry_id: string | null;
  access_token: string;
  status: ProposalStatus;
  deposit_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PuppyFinderOptionRow {
  id: string;
  proposal_id: string;
  name: string | null;
  breed: string | null;
  gender: string | null;
  age_text: string | null;
  color: string | null;
  size_text: string | null;
  price_cents: number | null;
  description: string | null;
  health_notes: string | null;
  photo_urls: string[];
  display_order: number;
  status: OptionStatus;
  is_selected: boolean;
  selected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PuppyFinderProposalWithOptions extends PuppyFinderProposalRow {
  options: PuppyFinderOptionRow[];
}

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  proposed: "Awaiting Selection",
  selected: "Puppy Selected - Deposit Pending",
  deposit_confirmed: "Deposit Confirmed",
};

/**
 * price_cents is the final, all-in, customer-facing Puppy Finder price
 * exactly as entered by the admin - this never adds a concierge fee or
 * any other automatic markup on top of it.
 */
export function formatOptionPrice(cents: number | null): string | null {
  if (cents === null || cents === undefined) return null;
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
