/**
 * "Featured on Aura++" badge — a static backlink to our listing on
 * auraplusplus.com, in exchange for being featured in their directory.
 *
 * Unlike AdSwap (components/landing/ad-swap.tsx), this is a plain <a><img>:
 * no iframe, no script, no third-party tracking, nothing that runs on our
 * origin. It's a link and a static SVG, so it doesn't touch the "no
 * advertising/tracking" claims in the legal pages the way AdSwap did.
 *
 * SAME SCOPE RULE AS AdSwap, for the same reason: marketing site footer
 * only, never a tenant portal board. Branding settings sell a white-labeled
 * board — our own cross-promotion isn't ours to put on a customer's board.
 */
export function AuraBadge() {
  return (
    <a
      href="https://auraplusplus.com/projects/feedback-collection-roadmap-tool"
      target="_blank"
      rel="noopener"
      title="View this project on Aura++"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external badge asset, not one of our own optimized images */}
      <img
        src="https://auraplusplus.com/images/badges/featured-on-light.svg"
        alt="Featured on Aura++"
        // The SVG's real intrinsic size (confirmed by fetching it directly) is
        // 150x44 — NOT 265x58. Wrong attrs here made the browser compute
        // `w-auto` from the wrong aspect ratio, so the badge rendered
        // letterboxed inside a box shaped for a different image.
        width={150}
        height={44}
        // Normalised to the shared badge rail height (footer in app/page.tsx);
        // width/height attrs stay for the intrinsic ratio, so no layout shift.
        className="h-9 w-auto"
      />
    </a>
  );
}
