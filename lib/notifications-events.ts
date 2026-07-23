"use client";

/**
 * Lightweight cross-component signal so the header's unread-count badge updates
 * the moment notifications change elsewhere in the app (e.g. marking one read on
 * the Notifications page) — without waiting for the header's periodic poll.
 */
const EVENT = "feedboard:notifications-changed";

/** Fire after any change to notifications (mark read, mark all read, delete). */
export function emitNotificationsChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

/** Subscribe to notification changes; returns an unsubscribe function. */
export function onNotificationsChanged(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
