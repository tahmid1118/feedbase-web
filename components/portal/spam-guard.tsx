"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_FEEDBOARD_API_BASE_URL || "http://localhost:4560";

/**
 * Invisible anti-bot helpers for the public portal's write forms.
 *
 * Both are deliberately zero-friction: a real visitor never sees a field, solves
 * a puzzle, or waits for anything. Neither is a hard gate — the backend folds
 * them into a spam score (src/common/spamScore.js), so a false reading costs a
 * few points rather than someone's feedback.
 */

/**
 * Name must match HONEYPOT_FIELD in the backend's publicWriteGuard.js.
 * Changing one without the other silently disables the trap.
 */
export const HONEYPOT_NAME = "website";

/**
 * A field no human can see or reach, which naive bots fill because they populate
 * every input they find.
 *
 * Hidden with off-screen positioning rather than `display:none` or
 * `type="hidden"`: some bots skip those precisely because they're the obvious
 * honeypot patterns, whereas an off-screen text input still looks real to a
 * form-scraper.
 *
 * `aria-hidden` + `tabIndex={-1}` keep it away from screen readers and keyboard
 * navigation, so it is genuinely invisible to real users including assistive
 * tech — a honeypot that traps screen-reader users would be an accessibility
 * bug, not a security feature.
 */
export function HoneypotField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
    >
      <label htmlFor={HONEYPOT_NAME}>Leave this field empty</label>
      <input
        id={HONEYPOT_NAME}
        name={HONEYPOT_NAME}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/**
 * Fetch a signed form token once, ON MOUNT.
 *
 * Mount, not dialog-open, on purpose. The backend rejects a submission that
 * arrives less than a few seconds after its token was issued (a human cannot
 * read a board and write feedback that fast, a script can). Starting the clock
 * at page load rather than when the dialog opens gives a genuinely fast human
 * plenty of headroom, so the check only ever catches automation.
 *
 * Failure is silent and non-blocking: no token just means the submission scores
 * as "came from something other than our page", which is a signal, not a block.
 */
export function useFormToken(): string | undefined {
  const [token, setToken] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/public/form-token`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json?.data?.token) setToken(json.data.token);
      } catch {
        /* offline or blocked — submitting still works, just scores lower */
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return token;
}
