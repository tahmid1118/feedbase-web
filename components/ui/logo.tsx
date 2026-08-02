/**
 * FeedBoard logo mark.
 *
 * Three rounded board rows forming an "F" — the stem plus two arms, reading as
 * rows on a feedback board — knocked out in white on the brand rose→secondary
 * gradient. The top arm sits at 62% so the F resolves as a letterform rather
 * than a solid block. Self-contained and scalable — size it with a className
 * (defaults to h-8 w-8). Pure SVG, no client JS.
 *
 * Keep this in sync with `app/icon.svg` (the favicon) and the backend's
 * `assets/app-icon.svg` (the platform-admin avatar and official board logo).
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="FeedBoard"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="fb-logo-gradient"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#c74959" />
          <stop offset="1" stopColor="#da6a78" />
        </linearGradient>
      </defs>

      {/* Brand squircle */}
      <rect width="32" height="32" rx="9" fill="url(#fb-logo-gradient)" />

      {/* Stem */}
      <rect x="8" y="6" width="5" height="20" rx="2.5" fill="#fff" />
      {/* Top arm — held back so the F reads as a letter, not a block */}
      <rect x="8" y="6" width="16" height="5" rx="2.5" fill="#fff" opacity="0.62" />
      {/* Middle arm */}
      <rect x="8" y="13.5" width="11.5" height="5" rx="2.5" fill="#fff" />
    </svg>
  );
}
