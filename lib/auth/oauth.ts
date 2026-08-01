/**
 * Shared bits of the social sign-in flow, so `auth.ts` (server) and the login
 * form (client) can't drift apart.
 */

/**
 * Set for one request to confirm a device takeover through a social sign-in.
 *
 * Password login can pass `force` straight into `signIn()` as a credential.
 * An OAuth sign-in has no such channel — the browser leaves for Google and
 * comes back through a callback URL we don't control — so the intent is parked
 * in a short-lived cookie that the `signIn` callback reads and clears.
 *
 * Safe as a cookie because it is not an authorisation: the backend still
 * re-checks the identity, and the worst a forged one can do is sign the SAME
 * account out of its other devices, which requires already being able to pass
 * Google's login for that account.
 */
export const OAUTH_FORCE_COOKIE = "fb_oauth_force";

/** Query param carrying a social sign-in failure back to /login. */
export const OAUTH_ERROR_PARAM = "oauth_error";

export const OAUTH_ERROR = {
  /** Live session elsewhere on a one-device plan — offer the takeover. */
  activeSession: "active_session",
  /** Provider hasn't verified the address, so we won't match an account by it. */
  emailUnverified: "email_unverified",
  /** Anything else: provider handshake or backend failure. */
  failed: "failed",
} as const;

export type OAuthErrorCode = (typeof OAUTH_ERROR)[keyof typeof OAUTH_ERROR];
