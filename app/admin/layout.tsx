export const metadata = {
  manifest: "/manifest.json",
};

// Never serve admin database reads from Next's fetch Data Cache. Without
// this, Supabase reads on force-dynamic admin pages were cached for a year,
// so new website inquiries (which never call revalidatePath) didn't show up
// in Contacts, the Message Center or the unread badge. Admin-only - the
// public site's caching is unaffected.
export const fetchCache = "force-no-store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
