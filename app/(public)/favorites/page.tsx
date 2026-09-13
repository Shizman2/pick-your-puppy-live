import "../puppies/puppies.css";
import { getVisitorFavorites } from "../../../lib/favorites";
import FavoritesGrid from "./FavoritesGrid";

// Unlike /puppies and /puppies/[slug] (ISR, revalidate = 60 - safe
// because their content is the same for every visitor), this page's
// entire content depends on reading the visitor's own cookie, so it
// can't be a shared cached page - it has to render fresh per request.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Favorites – ThePuppyPlugs.com",
};

export default async function FavoritesPage() {
  const favorites = await getVisitorFavorites();

  return (
    <>
      <div className="page-title">My Favorites 🐾</div>
      <div className="page-sub">Puppies you&apos;ve saved for later.</div>
      <FavoritesGrid favorites={favorites} />
    </>
  );
}
