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
        width={250}
        alt="Fazier badge"
      />
    </a>
  );
}
