import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server client aware of the logged-in admin's session (via cookies).
 * Still only uses the publishable key - this checks "is someone logged
 * in", it does not bypass Row Level Security or read the events table
 * directly. That's what lib/supabase/admin.ts is for.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Expected when called from a Server Component (not a Route
            // Handler or Server Action) - Next.js doesn't allow writing
            // cookies there. Middleware is what actually persists a
            // refreshed session; this just silently no-ops instead of
            // that restriction surfacing as a false "not logged in".
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Same as above.
          }
        },
      },
    }
  );
}
