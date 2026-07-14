"use client";

import { signOut } from "next-auth/react";

import { usersApi } from "@/lib/api";

/**
 * Sign out for real: revoke the device session on the backend, *then* clear the
 * NextAuth cookie.
 *
 * Dropping the cookie alone is not enough. On Free/Pro (one device at a time)
 * the server-side session is what blocks the next login — leave it alive and the
 * user is told "you're already signed in elsewhere" when they try to come back.
 *
 * The revoke is best-effort: if the backend is unreachable we still sign out
 * locally rather than trapping the user in the app. The abandoned session then
 * ages out on its own (see IDLE_MINUTES on the backend) and the next login takes
 * it over.
 */
export async function endSession(
  accessToken: string | undefined | null,
  options?: { callbackUrl?: string }
) {
  if (accessToken) {
    try {
      await usersApi.logout(accessToken);
    } catch {
      /* best-effort — never block sign-out on it */
    }
  }
  await signOut({ callbackUrl: options?.callbackUrl ?? "/login" });
}
