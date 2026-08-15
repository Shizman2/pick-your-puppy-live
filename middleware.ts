import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs only on /admin/* and /show/* (see matcher below) - every other
 * public route (/, /puppies, /puppy-finder, etc.) never hits this, so
 * anonymous visitors don't pay for a Supabase auth round-trip they have
 * no use for.
 *
 * /admin: if there's no logged-in Supabase session, redirect to
 * /admin/login instead of rendering the dashboard.
 *
 * /show/[slug]: does not require login - it's included here purely so
 * an admin's session cookie stays refreshed on that route, which its
 * own server component relies on for the `?preview=` override.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  // Only /admin itself is gated with a redirect. /show/[slug] matches this
  // middleware (see matcher) purely to refresh the session cookie, not to
  // block access - it has no gating logic here.
  if (isAdminRoute) {
    if (!user && !isLoginPage) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (user && isLoginPage) {
      const adminUrl = new URL("/admin", request.url);
      return NextResponse.redirect(adminUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/show/:path*"],
};
