/**
 * "Featured on ToolFio" badge — a static backlink to toolfio.com, in
 * exchange for being featured in their directory.
 *
 * Same shape and same scope rule as the other directory badges
 * (components/landing/*-badge.tsx): a plain <a><img>, no iframe, no script,
 * no third-party tracking — marketing site footer only, never a tenant
 * portal board.
 *
 * The `-light` asset is the light-background variant (white pill, grey
 * hairline border, dark text), which is the one that belongs on our
 * light-only footer; `toolfio-dark-badge.png` is for dark pages.
 *
 * `rel` keeps "dofollow" from their snippet — not a real rel token and
 * ignored by crawlers, but it's what the directory's copy-paste asks for;
 * the meaningful half is that we don't send `nofollow`. `noopener` is added
 * because target="_blank" without it hands the new tab a window.opener
 * handle to this page.
 */
export function ToolfioBadge() {
  return (
    <a
      href="https://toolfio.com"
      target="_blank"
      rel="dofollow noopener"
      title="Featured on ToolFio"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external badge asset, not one of our own optimized images */}
      <img
        src="https://toolfio.com/toolfio-light-badge.png"
        alt="Featured on ToolFio"
        width={200}
        height={54}
        // Normalised to the shared badge rail height (footer in app/page.tsx);
        // width/height attrs stay for the intrinsic ratio, so no layout shift.
        className="h-[54px] w-auto"
      />
    </a>
  );
}
