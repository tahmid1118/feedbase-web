"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { OAUTH_FORCE_COOKIE } from "@/lib/auth/oauth";
import { cn } from "@/lib/utils";

/**
 * Google's mark, inlined. Their branding guidelines require the official
 * four-colour "G" and forbid recolouring it, so this must not inherit
 * `currentColor` the way the rest of our icons do.
 */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * "Continue with Google". Handles both signing in and signing up — the backend
 * provisions an account on first use, so there is nothing to choose between.
 *
 * Unlike the password form this is a full-page redirect, so it can't report a
 * result inline: failures come back as `?oauth_error=` on /login, which the
 * login form renders (including the device-takeover offer).
 */
export function GoogleButton({
  label,
  /**
   * Confirmed device takeover after a 409. Parked in a one-shot cookie because
   * the browser leaves for Google and returns through a callback we don't
   * control, so there is no request body to carry it in.
   */
  force = false,
  callbackUrl = "/",
  className,
}: {
  label: string;
  force?: boolean;
  callbackUrl?: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);

  const start = () => {
    setPending(true);
    if (force) {
      document.cookie = `${OAUTH_FORCE_COOKIE}=1; path=/; max-age=300; samesite=lax`;
    }
    void signIn("google", { callbackUrl });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={start}
      disabled={pending}
      // `min-h` + `whitespace-normal`, not the usual fixed `h-11`: the base
      // Button is `whitespace-nowrap`, so a long label (the takeover wording, or
      // a longer translation of it) overflows the rounded border instead of
      // wrapping. Height grows with the text rather than clipping it.
      className={cn(
        "min-h-11 w-full rounded-xl border-[#e399a3]/65 bg-white px-4 py-2 text-sm font-semibold whitespace-normal text-[#1c0a0c] hover:bg-[#c74959]/10 hover:text-[#c74959]",
        className
      )}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <GoogleMark className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}

/** The "or" rule between the social button and the email form. */
export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-[#e399a3]/45" />
      <span className="text-xs uppercase tracking-wide text-[#1c0a0c]/45">
        {label}
      </span>
      <span className="h-px flex-1 bg-[#e399a3]/45" />
    </div>
  );
}
