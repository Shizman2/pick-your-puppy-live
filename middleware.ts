import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs only on /admin/*, /partners/*, and /show/* (see matcher below) -
 * every other public route (/, /puppies, /puppy-finder, etc.) never
 * hits this, so anonymous visitors don't pay for a Supabase auth
 * round-trip they have no use for.
 *
 * /admin: requires an authenticated session that ALSO holds the
 * 'admin' role in user_roles. Before the affiliate program existed,
 * "is there a session" WAS the entire security model (every account in
 * this project was an admin account) - that stopped being safe the
 * moment affiliate accounts started sharing the same auth.users pool,
 * so this now does a real role check, not just a login check.
 *
 * /partners: requires an authenticated session holding the 'affiliate'
 * role AND an approved affiliates row - a suspended/pending/rejected
 * affiliate is redirected to /partners/login exactly like a logged-out
 * visitor, never shown the dashboard.
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

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginPage = pathname === "/admin/login";
  const isPartnersRoute = pathname.startsWith("/partners");
  const isPartnersPublicPage = pathname === "/partners/login" || pathname === "/partners/apply";

  if (isAdminRoute && !isAdminLoginPage) {
    const isAdmin = user ? await hasRole(user.id, "admin") : false;
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (isAdminRoute && isAdminLoginPage && user && (await hasRole(user.id, "admin"))) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isPartnersRoute && !isPartnersPublicPage) {
    const isApprovedAffiliate = user ? await isApprovedAffiliateUser(user.id) : false;
    if (!isApprovedAffiliate) {
      return NextResponse.redirect(new URL("/partners/login", request.url));
    }
  }

  if (isPartnersRoute && pathname === "/partners/login" && user && (await isApprovedAffiliateUser(user.id))) {
    return NextResponse.redirect(new URL("/partners/dashboard", request.url));
  }

  return response;
}

/**
 * Edge-runtime role check using the service-role client, same trust
 * model as lib/supabase/admin.ts - this deliberately bypasses RLS
 * (user_roles/affiliates have no public policies), because middleware
 * is the one place this check MUST be authoritative rather than
 * relying on a logged-in user's own row-level access to themselves.
 */
function adminDbClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function hasRole(userId: string, role: "admin" | "affiliate"): Promise<boolean> {
  const { data } = await adminDbClient().from("user_roles").select("role").eq("user_id", userId).eq("role", role).maybeSingle();
  return Boolean(data);
}

async function isApprovedAffiliateUser(userId: string): Promise<boolean> {
  if (!(await hasRole(userId, "affiliate"))) return false;
  const { data } = await adminDbClient().from("affiliates").select("status").eq("auth_user_id", userId).maybeSingle();
  return data?.status === "approved";
}

export const config = {
  matcher: ["/admin/:path*", "/partners/:path*", "/show/:path*"],
};
