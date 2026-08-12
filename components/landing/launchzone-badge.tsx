/**
 * "Find us on LaunchZone" badge — a static backlink to our listing on
 * launchzone.co, in exchange for being featured there.
 *
 * Same shape and same scope rule as AuraBadge / FazierBadge
 * (components/landing/{aura,fazier}-badge.tsx): a plain <a><img>, no iframe,
 * no script, no third-party tracking — marketing site footer only, never a
 * tenant portal board.
 *
 * The height is normalised to the shared badge rail height (see the footer in
 * app/page.tsx); width/height attrs stay on the element so the intrinsic aspect
 * ratio is known before the SVG loads and the row doesn't shift.
 */
export function LaunchZoneBadge() {
  return (
    <a
      href="https://launchzone.co/p/feedboardapp"
      target="_blank"
      rel="noopener"
      title="Find us on LaunchZone"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external badge asset, not one of our own optimized images */}
      <img
        src="https://launchzone.co/badge.svg"
        alt="Find us on LaunchZone"
        width={154}
        height={54}
        className="h-9 w-auto"
      />
    </a>
  );
}
