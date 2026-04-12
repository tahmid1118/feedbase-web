import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import {
  DEFAULT_LANGUAGE,
  LOGIN_RATE_LIMIT,
} from "@/lib/auth/constants";
import { loginWithCredentials } from "@/lib/auth/auth-service";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/auth/schemas";

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
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.userId;
        token.accessToken = user.accessToken;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
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
