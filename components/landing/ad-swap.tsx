/**
 * Ad Swap — a reciprocal ad exchange for small sites (https://ad-swap.web.app).
 * We show one member's ad; ours gets shown across the network. Free traffic in
 * exchange for a 300x130 slot.
 *
 * SCOPE IS DELIBERATE AND LOAD-BEARING: this renders on FeedBoard's own
 * MARKETING pages only. It must never reach a tenant portal board.
 *   - Branding settings sell a white-labeled board; putting a third-party ad on
 *     a paying customer's board would sell them the opposite of what they paid
 *     for.
 *   - The portal's audience is the customer's users, not ours. Monetising their
 *     visitors with our barter deal isn't ours to do.
 * The landing footer (app/page.tsx) and the portal footer
 * (app/portal/[tenant]/layout.tsx) are separate markup, so this stays contained
 * by construction — but if that ever gets unified, this component is the thing
 * that must not come along.
 *
 * A plain <iframe>, per Ad Swap's docs, so no script runs on our origin and a
 * strict CSP is unaffected. `sandbox` is theirs, minus `allow-top-navigation`:
 * an ad must not be able to navigate the page out from under a visitor.
 *
 * Renders NOTHING until NEXT_PUBLIC_ADSWAP_SITE_ID is set — same env-gated
 * pattern as the Umami tag in app/layout.tsx, so local dev and any deploy
 * without the id simply has no ad. NEXT_PUBLIC_* is inlined at build time, so
 * setting it needs a rebuild, not just a restart.
 */

const SITE_ID = process.env.NEXT_PUBLIC_ADSWAP_SITE_ID;

export function AdSwap() {
  if (!SITE_ID) return null;

  // theme=light: the app is light-only (globals.css forces color-scheme:light),
  // so letting the ad follow the VISITOR's system theme would drop a dark card
  // into a light page for anyone on dark mode.
  const src = `https://ad-swap.web.app/frame.html?site=${encodeURIComponent(
    SITE_ID
  )}&theme=light`;

  return (
    <div className="flex flex-col items-center gap-1.5 lg:items-end">
      {/* Labelled, because an unlabelled ad among our own footer links reads as
          a FeedBoard endorsement. Also what keeps the privacy-policy wording
          ("a small ad from another site") honest to what a visitor sees. */}
      <span className="text-[10px] uppercase tracking-wide text-[#1c0a0c]/35">
        From around the web
      </span>
      <iframe
        src={src}
        title="Advertisement from another site"
        loading="lazy"
        // Their recommended sandbox, minus allow-top-navigation.
        sandbox="allow-scripts allow-same-origin allow-popups"
        // referrerPolicy tightened from the site-wide default: the ad network
        // has no need for the path a visitor came from.
        referrerPolicy="no-referrer"
        style={{ border: 0, width: 300, height: 130, maxWidth: "100%" }}
      />
    </div>
  );
}
