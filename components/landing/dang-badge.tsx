/**
 * "Verified on DANG!" badge — a static backlink to our listing on dang.ai,
 * in exchange for being verified in their directory.
 *
 * Same shape and same scope rule as the other directory badges
 * (components/landing/{aura,fazier,launchzone}-badge.tsx): a plain <a><img>,
 * no iframe, no script, no third-party tracking — marketing site footer only,
 * never a tenant portal board.
 *
 * DANG! ships two variants at the same 550x198 intrinsic size. We use
 * `-light`, NOT the `-dark` one from their default snippet: `-dark` is a
 * solid dark pill, which would drop a black block into a light-only footer
 * (globals.css forces color-scheme:light) beside three light badges. Same
 * reasoning as AuraBadge's `featured-on-light.svg` and FazierBadge's
 * `theme=light`.
 *
 * `rel` keeps "dofollow" from their snippet — it's not a real rel token and
 * crawlers ignore it, but it's what the directory's own copy-paste asks for,
 * and the meaningful half is that we do NOT send `nofollow`.
 */
export function DangBadge() {
  return (
    <a
      href="https://dang.ai"
      target="_blank"
      rel="dofollow noopener"
      title="Verified on DANG!"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external badge asset, not one of our own optimized images */}
      <img
        src="https://assets.dang.ai/badges/dang-verified-light.png"
        alt="Verified on DANG!"
        width={260}
        height={94}
        // Normalised to the shared badge rail height (footer in app/page.tsx);
        // width/height attrs stay for the intrinsic ratio, so no layout shift.
        className="h-[54px] w-auto"
      />
    </a>
  );
}
