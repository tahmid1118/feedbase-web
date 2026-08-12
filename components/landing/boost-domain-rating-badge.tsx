/**
 * Boost Domain Rating badge — a static backlink to our listing on
 * boostdomainrating.com, in exchange for a domain-rating badge.
 *
 * Same shape and same scope rule as the other directory badges
 * (components/landing/*-badge.tsx): a plain <a><img>, no iframe, no script,
 * no third-party tracking — marketing site footer only, never a tenant
 * portal board.
 *
 * UNLIKE the other badges, this asset is NOT static — it's an SVG rendered
 * server-side per request (`Cache-Control: no-cache`), showing our domain's
 * live rating on their platform. Confirmed by fetching it directly: real
 * intrinsic size is 300x54 (`width="300.427..." height="54"`, rounded here),
 * so no aspect-ratio correction was needed like AuraBadge/FazierBadge — but
 * because it's regenerated on every load, whatever score/certification state
 * we have on boostdomainrating.com is what visitors see, with nothing to fix
 * in this file if that state changes.
 */
export function BoostDomainRatingBadge() {
  return (
    <a
      href="https://boostdomainrating.com/item/feedboardapp.com?utm_source=badge"
      target="_blank"
      rel="noopener noreferrer"
      title="FeedBoard - Domain Rating"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external badge asset, not one of our own optimized images */}
      <img
        src="https://boostdomainrating.com/api/badge/feedboardapp.com"
        alt="FeedBoard - Domain Rating"
        width={300}
        height={54}
        // Normalised to the shared badge rail height (footer in app/page.tsx);
        // width/height attrs stay for the intrinsic ratio, so no layout shift.
        className="h-9 w-auto"
      />
    </a>
  );
}
