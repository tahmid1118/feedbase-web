"use client";

import { useEffect } from "react";

/**
 * Re-run a fetch when the tab/window regains focus or becomes visible again, so
 * a page reflects changes made elsewhere (e.g. dragging on the roadmap updates a
 * post's status, which should show on the feedback board when you return to it).
 *
 * The initial load is the caller's responsibility — this only fires on
 * focus/visibility, never on mount. Pass a stable (memoized) `refetch`.
 */
export function useRefetchOnFocus(refetch: () => void) {
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") refetch();
    };
    window.addEventListener("focus", handler);
    document.addEventListener("visibilitychange", handler);
    return () => {
      window.removeEventListener("focus", handler);
      document.removeEventListener("visibilitychange", handler);
    };
  }, [refetch]);
}
