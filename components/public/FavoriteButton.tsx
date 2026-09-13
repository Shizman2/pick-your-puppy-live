"use client";

import { useEffect, useRef, useState } from "react";
import { toggleFavorite, isPuppyFavorited } from "../../app/(public)/favoriteActions";

function HeartIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}>
      <path
        d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/**
 * Self-contained on purpose: takes only a puppy id and the server-
 * rendered (non-personalized) starting count, then checks "is this
 * favorited by me" itself on mount and manages its own toggle state.
 * That makes it a plain drop-in on any card or the detail page with no
 * parent-level orchestration needed - grid pages just render one per
 * card and are done.
 */
export default function FavoriteButton({
  puppyId,
  initialCount,
  size = "card",
}: {
  puppyId: string;
  initialCount: number;
  size?: "card" | "detail";
}) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  // The mount-time "is this already favorited" check and a fast click
  // are two independent requests racing each other - without this
  // guard, a click made before that check resolves could get silently
  // overwritten back to the (stale) pre-click state once it finally
  // does. Once the visitor has clicked, their own action always wins.
  const hasInteracted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    isPuppyFavorited(puppyId).then((favorited) => {
      if (!cancelled && !hasInteracted.current) setIsFavorited(favorited);
    });
    return () => {
      cancelled = true;
    };
  }, [puppyId]);

  async function handleClick(e: React.MouseEvent) {
    // Cards are wrapped in an <a> to the puppy's detail page - the
    // heart must toggle in place, never navigate.
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    hasInteracted.current = true;
    const optimisticNext = !isFavorited;
    setIsFavorited(optimisticNext);
    setCount((c) => Math.max(0, c + (optimisticNext ? 1 : -1)));
    setPending(true);

    const result = await toggleFavorite(puppyId);
    setPending(false);

    if (!result.success) {
      // Revert the optimistic update - the write never happened.
      setIsFavorited(!optimisticNext);
      setCount((c) => Math.max(0, c + (optimisticNext ? -1 : 1)));
      return;
    }
    if (result.isFavorited !== optimisticNext) {
      setIsFavorited(result.isFavorited);
    }
  }

  const iconSize = size === "detail" ? 20 : 15;

  return (
    <button
      type="button"
      className={`favorite-btn favorite-btn--${size}${isFavorited ? " is-favorited" : ""}`}
      onClick={handleClick}
      disabled={pending}
      aria-pressed={isFavorited}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <HeartIcon filled={isFavorited} size={iconSize} />
      <span className="favorite-btn-count">{count}</span>
    </button>
  );
}
