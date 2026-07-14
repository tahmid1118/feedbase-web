/**
 * Codes NextAuth carries out of `authorize()` and back to the login form via
 * `signIn(..., { redirect: false }).code`. Shared so `auth.ts` (which throws
 * them) and the forms (which render them) can't drift apart.
 */
export const SIGNIN_ERROR_CODE = {
  activeSession: "active_session",
} as const;

export const SIGNIN_ERROR_MESSAGE: Record<string, string> = {
  [SIGNIN_ERROR_CODE.activeSession]:
    "You're already signed in on another device or browser. Sign out there first — or upgrade to Business to stay signed in on several devices.",
};

/** The message for a failed sign-in, falling back to the generic credentials error. */
export function signInErrorMessage(code: string | undefined | null): string {
  return (
    (code && SIGNIN_ERROR_MESSAGE[code]) ||
    "Invalid email or password. Please try again."
  );
}
