/**
 * FeedBoard's own public feedback board — where users of *this* app report bugs
 * and request features (we dogfood the product).
 *
 * It is an ordinary tenant portal, not a special case: a workspace whose
 * subdomain is `NEXT_PUBLIC_FEEDBACK_SUBDOMAIN`, owned by the platform admin's
 * own account (created by the backend's `scripts/create-official-board.js`).
 * That means it already supports both audiences with no extra work — a
 * logged-out visitor posts as a guest (email required so we can reply), and a
 * logged-in user is attributed to their account and can edit their own posts.
 */

const SUBDOMAIN = process.env.NEXT_PUBLIC_FEEDBACK_SUBDOMAIN || "feedback";
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

/** Subdomain of the official board, e.g. "feedback". */
export const officialBoardSubdomain = SUBDOMAIN;

/** True when the root host can't share a cookie onto its subdomains — a
 * single-label host (`localhost`) or a bare IP. */
const isSingleLabelHost = () =>
  !ROOT_DOMAIN.split(":")[0].includes(".") ||
  /^\d+\.\d+\.\d+\.\d+(:|$)/.test(ROOT_DOMAIN);

/**
 * Host-aware URL to any tenant's public board. On a real dotted domain this is
 * the branded `<sub>.<root>` subdomain (protocol-relative). On a single-label
 * host it's the same-origin `/portal/<sub>` path instead — the ONLY form where a
 * signed-in user's cookie reaches the portal in dev, so logged-in actions (the
 * verified tick, the admin's anonymous-mode toggle) actually work locally.
 */
export function portalUrlForSubdomain(subdomain: string): string {
  if (isSingleLabelHost()) return `/portal/${subdomain}`;
  return `//${subdomain}.${ROOT_DOMAIN}`;
}

/**
 * Link to the official board.
 *
 * In production this is the branded `feedback.<root>` subdomain. On a
 * single-label host (`localhost`, a bare IP) we use the direct `/portal/<sub>`
 * path instead: the proxy passes any `/portal/…` through unchanged, and a
 * `*.localhost` subdomain can't receive the auth cookie in dev, so the direct
 * path is the only form where a signed-in developer stays signed in.
 */
export function officialBoardUrl(): string {
  const isSingleLabelHost =
    !ROOT_DOMAIN.split(":")[0].includes(".") ||
    /^\d+\.\d+\.\d+\.\d+(:|$)/.test(ROOT_DOMAIN);
  if (isSingleLabelHost) return `/portal/${SUBDOMAIN}`;
  return `https://${SUBDOMAIN}.${ROOT_DOMAIN}`;
}
