/**
 * Product analytics — a thin, typed wrapper over the Umami tracker.
 *
 * WHY THIS EXISTS: the conversion audit found the Umami Events panel
 * completely empty. Every funnel stage past a raw pageview — signup started,
 * signup completed, workspace created, board shared, first feedback received —
 * was invisible, so activation could only be inferred. Pageviews alone cannot
 * tell you whether a signup finished or whether a new board ever got used.
 *
 * Design rules:
 *
 *  - **Never throws, never blocks.** Umami is env-gated (`NEXT_PUBLIC_UMAMI_*`
 *    are deliberately unset in dev, see CLAUDE.md), so `window.umami` is
 *    absent most of the time in local work. Every call no-ops silently rather
 *    than exploding in a click handler. Analytics must never be able to break
 *    a signup.
 *  - **Event names are a closed union.** A typo in a tracking string is
 *    invisible until you go looking for the funnel and find it split across
 *    two names, so the names live here and nowhere else.
 *  - **No PII.** Properties are counts, enums and booleans — never an email,
 *    name, or post body. The privacy policy describes analytics as
 *    non-identifying and that must stay true.
 */

/** The funnel, in order. Adding a stage means adding it here first. */
export type AnalyticsEvent =
  | "signup_started"
  | "signup_completed"
  | "workspace_created"
  | "board_shared"
  | "first_feedback_received";

type EventProps = Record<string, string | number | boolean | undefined>;

interface UmamiTracker {
  track: (event: string, data?: EventProps) => void;
}

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

/**
 * Record a funnel event. Safe to call from anywhere on the client, at any
 * time — before the tracker loads, in dev with no tracker at all, or inside a
 * component that also runs on the server.
 */
export function track(event: AnalyticsEvent, props?: EventProps): void {
  if (typeof window === "undefined") return;
  try {
    // Strip undefined so Umami doesn't store empty properties.
    const clean = props
      ? Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined))
      : undefined;
    window.umami?.track(event, clean as EventProps | undefined);
  } catch {
    // Analytics is never allowed to surface an error to the user.
  }
}

/**
 * Fire an event at most once per browser, keyed by `key`.
 *
 * Needed for milestone events that sit on a screen the user revisits —
 * `first_feedback_received` is observed by the dashboard noticing the board is
 * no longer empty, and without a guard it would re-fire on every visit and
 * inflate the activation number that the whole funnel is judged on.
 */
export function trackOnce(event: AnalyticsEvent, key: string, props?: EventProps): void {
  if (typeof window === "undefined") return;
  const storageKey = `fb_evt_${event}_${key}`;
  try {
    if (window.localStorage.getItem(storageKey)) return;
    window.localStorage.setItem(storageKey, "1");
  } catch {
    // Private mode / storage disabled: fall through and track anyway. A
    // duplicate is a smaller problem than a missing activation signal.
  }
  track(event, props);
}

/**
 * Self-traffic exclusion.
 *
 * The audit found 56% of all pageviews came from the developer's own sessions
 * (17 visitors producing 97 visits and 362 views), which dragged the reported
 * bounce rate down from a real ~81% to 61% and made every average unusable.
 * Umami's own opt-out is a localStorage flag, so these just set and clear it.
 *
 * Call `disableAnalytics()` once from the browser console on each machine you
 * develop or test on:  `window.__fbAnalyticsOff()`
 */
export function disableAnalytics(): void {
  try {
    window.localStorage.setItem("umami.disabled", "1");
  } catch {}
}

export function enableAnalytics(): void {
  try {
    window.localStorage.removeItem("umami.disabled");
  } catch {}
}

export function analyticsDisabled(): boolean {
  try {
    return window.localStorage.getItem("umami.disabled") === "1";
  } catch {
    return false;
  }
}
