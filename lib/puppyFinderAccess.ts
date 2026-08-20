import "server-only";
import { createClient } from "@supabase/supabase-js";
import type {
  PuppyFinderOptionRow,
  PuppyFinderProposalRow,
  PuppyFinderProposalWithOptions,
} from "./puppyFinderTypes";

/**
 * A Supabase client whose reads are never served from Next.js's fetch
 * Data Cache. Every Puppy Finder read (proposal status, options, who's
 * selected what) needs to reflect the very latest write immediately -
 * a customer's selection, an admin's deposit confirmation, a
 * newly-added option. In practice, `dynamic = "force-dynamic"` on the
 * page alone was not enough to prevent a `fetch()` issued from an
 * awaited helper module like this one from being served out of Next's
 * Data Cache; only an explicit `revalidatePath` for that exact route
 * reliably busted it, and admin mutations don't revalidate every route
 * that might read this data. Forcing `cache: "no-store"` on the
 * underlying fetch removes that dependency entirely - every Puppy
 * Finder read goes through this client instead of the shared
 * lib/supabase/admin.ts one.
 */
export function createPuppyFinderReadClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

/**
 * Looks up a proposal (and its options) by its private access token.
 * Unlike the media-placement preview token, this token is long-lived by
 * design - a customer needs to be able to revisit this link for weeks -
 * so there is no expiry check here, only an exact match. The token
 * itself is the entire access control, same model as the events.slug
 * private show link.
 */
export async function getProposalByToken(token: string): Promise<PuppyFinderProposalWithOptions | null> {
  if (!token) return null;
  const admin = createPuppyFinderReadClient();

  const { data: proposal, error: proposalError } = await admin
    .from("puppy_finder_proposals")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();

  if (proposalError || !proposal) return null;

  const { data: options, error: optionsError } = await admin
    .from("puppy_finder_options")
    .select("*")
    .eq("proposal_id", proposal.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (optionsError) return null;

  return {
    ...(proposal as PuppyFinderProposalRow),
    options: (options || []) as PuppyFinderOptionRow[],
  };
}
