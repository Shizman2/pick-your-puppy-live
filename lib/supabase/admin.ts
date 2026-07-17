import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only, trusted Supabase client using the secret key.
 * This bypasses Row Level Security entirely, which is intentional:
 * the events table has no public policies at all (see the SQL migration),
 * so this is the only way any part of the app - public page, API route,
 * or admin dashboard - can read or write event data. The "server-only"
 * import above makes it a build error if this ever gets pulled into a
 * client component by mistake.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
