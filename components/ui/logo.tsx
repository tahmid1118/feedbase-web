/**
 * Feedbase logo mark.
 *
 * A speech bubble (feedback) with an upvote chevron (voting) on the brand
 * rose→secondary gradient. Self-contained and scalable — size it with a
 * className (defaults to h-8 w-8). Pure SVG, no client JS.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Feedbase"
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

      {/* Speech bubble + tail */}
      <path d="M12.4 18.6 L10.8 24 L16.6 18.6 Z" fill="#fff" />
      <rect x="6.5" y="8" width="19" height="11.5" rx="4" fill="#fff" />

      {/* Upvote chevron */}
      <path
        d="M11.8 16 L16 11.9 L20.2 16"
        stroke="#c74959"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
