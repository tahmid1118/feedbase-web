import type { Metadata } from "next";
import Script from "next/script";

import { auth } from "@/auth";
// All three typefaces live in lib/fonts.ts — change a font there, not here.
import { fontVariables } from "@/lib/fonts";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { getLanguage } from "@/lib/i18n/server";
import "./globals.css";

// Self-hosted Umami analytics (see CLAUDE.md's Environment Variables section).
// Both vars are optional and unset in local dev by design — that keeps dev/test
// traffic out of real analytics. Only renders the tag when both are present, so
// a misconfigured single var can't silently point at a blank src or website id.
const UMAMI_SRC = process.env.NEXT_PUBLIC_UMAMI_SRC;
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export const metadata: Metadata = {
  title: "FeedBoard",
  description: "Collect, prioritize, and ship product feedback with confidence.",
};

// Seed the single AuthSessionProvider server-side so authenticated pages have
// the session/token on first paint — without it there's a loading gap where the
// dashboard fires token-less API calls (backend replies "Access denied"). Every
// route is already dynamic (auth/portal reads), so this costs no static rendering.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const lng = await getLanguage();

  return (
    <html
      lang={lng}
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <I18nProvider lng={lng}>
          <AuthSessionProvider session={session}>{children}</AuthSessionProvider>
        </I18nProvider>
        {UMAMI_SRC && UMAMI_WEBSITE_ID && (
          <Script
            src={UMAMI_SRC}
            data-website-id={UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
