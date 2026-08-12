/**
 * "Featured on Twelve Tools" badge — a static backlink to twelve.tools, in
 * exchange for being featured in their directory.
 *
 * Same shape and same scope rule as the other directory badges
 * (components/landing/{aura,fazier,launchzone,dang}-badge.tsx): a plain
 * <a><img>, no iframe, no script, no third-party tracking — marketing site
 * footer only, never a tenant portal board.
 *
 * `badge0-white` is the light-background variant (white fill, grey hairline
 * border, dark text), which is the right one for our light-only footer —
 * `badge0-dark`/`-black` are for dark pages. Its intrinsic size is 200x54,
 * so it lands on the rail's 54px height at native scale; the width/height
 * attrs state that rather than the smaller 148x40 from their snippet (same
 * aspect ratio either way).
 */
export function TwelveToolsBadge() {
  return (
    <a
      href="https://twelve.tools"
      target="_blank"
      rel="noopener"
      title="Featured on Twelve Tools"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external badge asset, not one of our own optimized images */}
      <img
        src="https://twelve.tools/badge0-white.svg"
        alt="Featured on Twelve Tools"
        width={200}
        height={54}
        // Normalised to the shared badge rail height (footer in app/page.tsx);
        // width/height attrs stay for the intrinsic ratio, so no layout shift.
        className="h-[54px] w-auto"
      />
    </a>
  );
}
