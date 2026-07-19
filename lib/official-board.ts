/**
 * Feedbase's own public feedback board — where users of *this* app report bugs
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
