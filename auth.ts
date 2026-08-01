import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { cookies } from "next/headers";

import {
  DEFAULT_LANGUAGE,
  LOGIN_RATE_LIMIT,
} from "@/lib/auth/constants";
import {
  loginWithCredentials,
  loginAsAdmin,
  loginWithOAuth,
} from "@/lib/auth/auth-service";
import {
  OAUTH_ERROR,
  OAUTH_ERROR_PARAM,
  OAUTH_FORCE_COOKIE,
} from "@/lib/auth/oauth";
import type { SavedAdminIdentity } from "@/types/next-auth";
import { AuthApiError } from "@/lib/auth/errors";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/auth/schemas";
import { SIGNIN_ERROR_CODE } from "@/lib/auth/signin-errors";

/**
 * A Credentials provider normally collapses every failure into one opaque error.
 * Subclassing `CredentialsSignin` lets us set a `code`, which NextAuth surfaces
 * as `signIn(...).code` — how the login form tells "already signed in on another
 * device" apart from "wrong password".
 */
class ActiveSessionError extends CredentialsSignin {
  code = SIGNIN_ERROR_CODE.activeSession;
}

// The public portal lives on tenant subdomains, so we scope the session cookie to
// the parent domain (`.<root domain>`) — then every `*.<root domain>` subdomain
// shares the login. This only works for a real, DOTTED domain: browsers (per RFC
// 6265, verified against curl) refuse to set a `Domain` cookie for a single-label
// host like `localhost` or a bare IP, so those stay host-only and can't share a
// login onto a subdomain.
//
// Consequence for local dev: `*.localhost` subdomains can NOT receive the login
// cookie. Two ways to test logged-in portal actions locally:
//   1. Direct path — http://localhost:3000/portal/<tenant> (same origin as login,
//      so the cookie is present). Zero config.
//   2. Real subdomain — point NEXT_PUBLIC_ROOT_DOMAIN at a dotted loopback domain
//      such as `lvh.me:3000` (its wildcard `*.lvh.me` resolves to 127.0.0.1), log
//      in at http://lvh.me:3000 and open http://<tenant>.lvh.me:3000. The cookie
//      is `.lvh.me`, shared across subdomains exactly like production.
const ROOT_HOST = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000").split(
  ":"
)[0];
const IS_IP = /^(\d{1,3}\.){3}\d{1,3}$/.test(ROOT_HOST);
const SESSION_COOKIE_DOMAIN =
  ROOT_HOST.includes(".") && !IS_IP ? `.${ROOT_HOST}` : undefined;

const credentialsProvider = Credentials({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
    lg: { label: "Language", type: "text" },
    // "admin" authenticates against the separate admins table / admin panel.
    accountType: { label: "Account type", type: "text" },
    // "true" = owner-confirmed takeover after a 409 (sign out other devices).
    force: { label: "Force", type: "text" },
  },
  async authorize(rawCredentials) {
    const parsedCredentials = loginSchema.safeParse({
      email: rawCredentials?.email,
      password: rawCredentials?.password,
      lg: rawCredentials?.lg ?? DEFAULT_LANGUAGE,
    });

    if (!parsedCredentials.success) {
      return null;
    }

    const isAdminLogin = rawCredentials?.accountType === "admin";
    const normalizedEmail = parsedCredentials.data.email.toLowerCase();
    const limiterKey = `login:${isAdminLogin ? "admin:" : ""}${normalizedEmail}`;

    const isAllowed = consumeRateLimit(
      limiterKey,
      LOGIN_RATE_LIMIT.maxAttempts,
      LOGIN_RATE_LIMIT.windowMs
    );

    if (!isAllowed) {
      return null;
    }

    // Owner-confirmed takeover after a 409 — sign out other devices, then in.
    const force = rawCredentials?.force === "true";

    try {
      const profile = isAdminLogin
        ? await loginAsAdmin(parsedCredentials.data)
        : await loginWithCredentials({ ...parsedCredentials.data, force });
      return profile;
    } catch (error) {
      // 409 = the account already holds a live session on a plan that only
      // allows one device. Re-throw with a code so the form can say so, instead
      // of the misleading "invalid email or password".
      if (error instanceof AuthApiError && error.statusCode === 409) {
        throw new ActiveSessionError();
      }
      return null;
    }
  },
});

/**
 * "Continue with Google". NextAuth owns the handshake and verifies the ID token;
 * the `signIn` callback below then trades the verified identity for a FeedBoard
 * session, so the backend stays the single source of truth for accounts, plans
 * and the one-device rule.
 *
 * Only `openid email profile` — the non-sensitive scopes. That is what keeps
 * Google's verification to the light path and avoids the paid security
 * assessment restricted scopes require. Don't add scopes casually.
 *
 * `prompt: "select_account"` because people sign in to FeedBoard from a browser
 * that is often already signed in to a personal Google account; without it they
 * are silently taken through whichever account Google picks.
 */
const googleProvider = Google({
  authorization: {
    params: { scope: "openid email profile", prompt: "select_account" },
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [credentialsProvider, googleProvider],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: SESSION_COOKIE_DOMAIN,
      },
    },
  },
  callbacks: {
    /**
     * Social sign-in only. The Credentials provider has already done its work in
     * `authorize()`, so it passes straight through.
     *
     * Here we trade Google's verified identity for a FeedBoard session and hang
     * the result on `user`, which `jwt` below reads on the same pass. Returning
     * a STRING redirects the browser, which is the only way to surface a
     * specific reason for an OAuth failure — NextAuth otherwise collapses
     * everything into a generic error page, and the device-limit case needs to
     * offer the takeover button.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const providerUserId = profile?.sub ?? account.providerAccountId;
      const email = profile?.email;
      // Google reports this for the `email` scope. The backend refuses an
      // unverified address anyway — this is the same rule, stated twice on
      // purpose, because matching an account by an unverified email is an
      // account-takeover route rather than a mere inconvenience.
      const emailVerified = profile?.email_verified === true;

      if (!providerUserId || !email) {
        return `/login?${OAUTH_ERROR_PARAM}=${OAUTH_ERROR.failed}`;
      }
      if (!emailVerified) {
        return `/login?${OAUTH_ERROR_PARAM}=${OAUTH_ERROR.emailUnverified}`;
      }

      // A confirmed takeover after a 409. One-shot: cleared here so a stale
      // cookie can never silently sign other devices out on a later login.
      const jar = await cookies();
      const force = jar.get(OAUTH_FORCE_COOKIE)?.value === "1";
      if (force) jar.delete(OAUTH_FORCE_COOKIE);

      try {
        const profileResult = await loginWithOAuth({
          provider: "google",
          providerUserId,
          email,
          emailVerified,
          fullName: profile?.name ?? undefined,
          avatarUrl: profile?.picture ?? undefined,
          force,
        });
        if (!profileResult) {
          return `/login?${OAUTH_ERROR_PARAM}=${OAUTH_ERROR.failed}`;
        }
        // Carried into `jwt` on this same sign-in.
        Object.assign(user, profileResult);
        return true;
      } catch (error) {
        if (error instanceof AuthApiError && error.statusCode === 409) {
          return `/login?${OAUTH_ERROR_PARAM}=${OAUTH_ERROR.activeSession}`;
        }
        return `/login?${OAUTH_ERROR_PARAM}=${OAUTH_ERROR.failed}`;
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.userId;
        token.tenantId = user.tenantId;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        token.isAdmin = user.isAdmin ?? false;
        token.adminId = user.adminId ?? null;
        token.isPlatformAdmin = user.isPlatformAdmin ?? false;
      }

      // Client `update(...)` refreshes the session in place: profile edits send
      // { name, image }; switching workspace sends a fresh token + new tenant
      // identity so the dashboard re-scopes without a re-login.
      if (trigger === "update" && session && typeof session === "object") {
        const next = session as {
          name?: string;
          image?: string | null;
          accessToken?: string;
          tenantId?: string | null;
          role?: string | null;
          userId?: string;
          email?: string;
          isAdmin?: boolean;
          adminId?: string | null;
          savedAdmin?: SavedAdminIdentity | null;
        };
        if (next.name !== undefined) token.name = next.name;
        if (next.image !== undefined) token.image = next.image;
        if (next.accessToken !== undefined) token.accessToken = next.accessToken;
        if (next.tenantId !== undefined) token.tenantId = next.tenantId;
        if (next.role !== undefined) token.role = next.role;
        if (next.userId !== undefined) token.userId = next.userId;
        if (next.email !== undefined) token.email = next.email;
        // Admin → user handoff ("Open in dashboard"): the admin drops into a
        // workspace they own, so the session temporarily stops being an admin one
        // (or the dashboard would bounce it back to /admin). `savedAdmin` keeps a
        // snapshot of the admin identity so "Back to admin" restores it with no
        // re-login; it's cleared (null) on the way back.
        if (next.isAdmin !== undefined) token.isAdmin = next.isAdmin;
        if (next.adminId !== undefined) token.adminId = next.adminId;
        if (next.savedAdmin !== undefined) token.savedAdmin = next.savedAdmin;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const normalizedUserId =
          typeof token.userId === "string"
            ? token.userId
            : typeof token.sub === "string"
              ? token.sub
              : "";

        session.user.id = normalizedUserId;
        session.user.userId = normalizedUserId;
        session.user.tenantId =
          typeof token.tenantId === "string" ? token.tenantId : null;
        session.user.role = typeof token.role === "string" ? token.role : null;
        session.user.accessToken =
          typeof token.accessToken === "string" ? token.accessToken : "";
        session.user.name = typeof token.name === "string" ? token.name : null;
        session.user.email =
          typeof token.email === "string" ? token.email : "";
        session.user.image = typeof token.image === "string" ? token.image : null;
        session.user.isAdmin = token.isAdmin === true;
        session.user.adminId =
          typeof token.adminId === "string" ? token.adminId : null;
        session.user.isPlatformAdmin = token.isPlatformAdmin === true;
        session.user.savedAdmin =
          (token.savedAdmin as SavedAdminIdentity | null | undefined) ?? null;
      }

      return session;
    },
  },
});
