/**
 * "Featured on Find Tool For" badge — a static backlink to our listing on
 * findtoolfor.com, in exchange for being featured in their directory.
 *
 * Same shape and same scope rule as the other directory badges
 * (components/landing/*-badge.tsx): a plain <a><img>, no iframe, no script,
 * no third-party tracking — marketing site footer only, never a tenant
 * portal board.
 *
 * The `-light` asset is the light-background variant, which is the one that
 * belongs on our light-only footer (`featured-on-dark.svg` exists for dark
 * pages). Real intrinsic size is 150x44, read from the SVG's own
 * width/height rather than assumed, so `h-9 w-auto` lands on the shared rail
 * height with no layout shift and no squashed artwork.
 *
 * `rel` is what their snippet asks for; `noopener` matters on its own, since
 * target="_blank" without it hands the new tab a window.opener handle to this
 * page.
 */
export function FindToolForBadge() {
  return (
    <a
      href="https://findtoolfor.com/projects/feedboard?utm_source=badge"
      target="_blank"
      rel="noopener noreferrer"
      title="Featured on Find Tool For"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external badge asset, not one of our own optimized images */}
      <img
        src="https://findtoolfor.com/findtoolfor/images/badges/featured-on-light.svg"
        alt="Featured on Find Tool For"
        width={150}
        height={44}
        // Normalised to the shared badge rail height (footer in app/page.tsx);
        // width/height attrs stay for the intrinsic ratio, so no layout shift.
        className="h-9 w-auto"
      />
    </a>
  );
}
