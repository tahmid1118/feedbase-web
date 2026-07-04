/**
 * Incognito (fedora + dark glasses) glyph used as the avatar for anonymous
 * guests on the public portal, so anonymous comments are visually obvious at a
 * glance. Inherits color via `currentColor`.
 */
export function IncognitoIcon({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {/* fedora crown */}
      <path d="M7.2 9.2C7.7 6.2 9 4.8 12 4.8s4.3 1.4 4.8 4.4z" />
      {/* fedora brim */}
      <ellipse cx="12" cy="9.6" rx="9" ry="1.5" />
      {/* dark glasses + bridge */}
      <circle cx="8.1" cy="15" r="2.8" />
      <circle cx="15.9" cy="15" r="2.8" />
      <rect x="10.4" y="14.2" width="3.2" height="1.5" rx="0.75" />
    </svg>
  );
}
