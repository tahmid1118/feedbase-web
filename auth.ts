import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import {
  DEFAULT_LANGUAGE,
  LOGIN_RATE_LIMIT,
} from "@/lib/auth/constants";
import { loginWithCredentials } from "@/lib/auth/auth-service";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/auth/schemas";

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

    const normalizedEmail = parsedCredentials.data.email.toLowerCase();
    const limiterKey = `login:${normalizedEmail}`;

    const isAllowed = consumeRateLimit(
      limiterKey,
      LOGIN_RATE_LIMIT.maxAttempts,
      LOGIN_RATE_LIMIT.windowMs
    );

    if (!isAllowed) {
      return null;
    }

    try {
      const user = await loginWithCredentials(parsedCredentials.data);
      return user;
    } catch {
      return null;
    }
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [credentialsProvider],
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.userId;
        token.tenantId = user.tenantId;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
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
        };
        if (next.name !== undefined) token.name = next.name;
        if (next.image !== undefined) token.image = next.image;
        if (next.accessToken !== undefined) token.accessToken = next.accessToken;
        if (next.tenantId !== undefined) token.tenantId = next.tenantId;
        if (next.role !== undefined) token.role = next.role;
        if (next.userId !== undefined) token.userId = next.userId;
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
      }

      return session;
    },
  },
});
