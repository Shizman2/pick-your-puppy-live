"use client";

export default function BottomNav() {
  return (
    <nav className="pp-bottom-nav">
      <a className="pp-nav-item" href="/">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M3 12L12 4l9 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        Home
      </a>
      <a className="pp-nav-item" href="/puppies">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="11" r="5" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M7 9c0-1 .5-2 1.5-2.5M17 9c0-1-.5-2-1.5-2.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <ellipse cx="12" cy="18" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Puppies
      </a>
      <a className="pp-nav-item" href="/favorites">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
        Favorites
      </a>
      <a className="pp-nav-item" href="/puppy-finder">
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 3h6v3H9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Request
      </a>
      <a className="pp-nav-item" href="/inquire?type=pypl">
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10 10l5 3-5 3z" fill="currentColor" />
        </svg>
        Live
      </a>
    </nav>
  );
}
