import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client - only ever uses the publishable key, safe to ship to
 * the client bundle. Used for the admin login form's sign-in call.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
