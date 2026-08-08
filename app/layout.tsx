import type { Metadata } from "next";
import Script from "next/script";

import { auth } from "@/auth";
// All three typefaces live in lib/fonts.ts — change a font there, not here.
import { fontVariables } from "@/lib/fonts";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { getLanguage } from "@/lib/i18n/server";
import { appUrl } from "@/lib/app-url";
import "./globals.css";

// Self-hosted Umami analytics (see CLAUDE.md's Environment Variables section).
// Both vars are optional and unset in local dev by design — that keeps dev/test
// traffic out of real analytics. Only renders the tag when both are present, so
// a misconfigured single var can't silently point at a blank src or website id.
const UMAMI_SRC = process.env.NEXT_PUBLIC_UMAMI_SRC;
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

// Site-wide SEO defaults (CLAUDE.md's SEO section). A page that needs its own
// title/description/canonical (pricing, legal, portal posts) sets its own
// `metadata`/`generateMetadata`, which merges over these rather than replacing
// them — so every page still inherits metadataBase, the OG/Twitter shape, and
// the root app/opengraph-image.tsx unless it defines its own.
const SITE_DESCRIPTION =
  "Collect product feedback, let users vote on what matters, and share a public roadmap and changelog. A Canny/UserJot alternative with anonymous feedback on the free plan.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: "FeedBoard — Feedback Board & Public Roadmap Software",
    template: "%s — FeedBoard",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "feedback board software",
    "product feedback tool",
    "public roadmap tool",
    "changelog tool",
    "Canny alternative",
    "UserJot alternative",
    "feature request tracking",
  ],
  openGraph: {
    type: "website",
    siteName: "FeedBoard",
    title: "FeedBoard — Feedback Board & Public Roadmap Software",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "FeedBoard — Feedback Board & Public Roadmap Software",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  /**
   * Declared here rather than left to the `app/favicon.ico` file convention.
   *
   * That convention emits its `<link>` on EVERY route and a nested layout's
   * `metadata.icons` cannot suppress it (verified: it overrode `app/icon.svg`
   * but the favicon.ico link survived). On a tenant board that meant Chrome
   * had both FeedBoard's .ico and the customer's logo to choose from — and for
   * a PNG logo, which is what most customers upload, it picked ours. The
   * white-labeled board showed our "F" in the browser tab.
   *
   * `public/favicon.ico` serves at exactly the same `/favicon.ico` URL, so
   * Google's favicon crawler is unaffected; declaring it here keeps the
   * explicit `<link>` on marketing pages, and the portal layout can now replace
   * it wholesale.
   */
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
  },
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
