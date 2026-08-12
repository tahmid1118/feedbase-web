/**
 * Fazier launch badge — a static backlink to our launch listing on
 * fazier.com, in exchange for being featured there.
 *
 * Same shape and same scope rule as AuraBadge (components/landing/aura-badge.tsx):
 * a plain <a><img>, no iframe/script/tracking, marketing site footer only —
 * never a tenant portal board.
 */
export function FazierBadge() {
  return (
    <a href="https://fazier.com/launches/feedboardapp.com" target="_blank" rel="noopener">
      {/* eslint-disable-next-line @next/next/no-img-element -- external badge asset, not one of our own optimized images */}
      <img
        src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=light"
        // Real intrinsic size (confirmed by fetching the SVG directly) is
        // 182x43, not 250x54 — close enough to not be obviously broken like
        // Aura++'s was, but still a ~9% aspect-ratio error that subtly
        // stretched the badge.
        width={182}
        height={43}
        alt="Fazier badge"
        // Normalised to the shared badge rail height (footer in app/page.tsx);
        // width/height attrs stay for the intrinsic ratio, so no layout shift.
        className="h-9 w-auto"
      />
    </a>
  );
}
